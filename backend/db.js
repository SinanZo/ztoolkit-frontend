/**
 * db.js — Prisma-backed persistence with a safe file-store fallback for dev.
 * - Exports idempotency helpers and subscription upsert/read operations.
 * - If DATABASE_URL is not provided, the module uses a file-backed store so the
 *   rest of the app works without a DB in dev.
 */
import fs from 'fs';
import path from 'path';

let prisma = null;
if (process.env.DATABASE_URL) {
  try {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
  } catch (err) {
    prisma = null;
  }
}

const EVENTS_FILE = path.resolve(process.cwd(), 'backend', '.processed_events.json');
function loadFileStore() {
  try {
    const raw = fs.readFileSync(EVENTS_FILE, 'utf8');
    return new Set(JSON.parse(raw || '[]'));
  } catch (err) {
    return new Set();
  }
}
function persistFileStore(set) {
  try {
    const dir = path.dirname(EVENTS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(Array.from(set), null, 2));
  } catch (e) {
    // Non-fatal warning in development
  }
}

const fileStore = {
  processed: loadFileStore(),
  markProcessed(id) {
    this.processed.add(id);
    persistFileStore(this.processed);
  },
  isProcessed(id) {
    return this.processed.has(id);
  },
};

export function isDbAvailable() {
  return Boolean(process.env.DATABASE_URL && prisma);
}

export async function isEventProcessed(id) {
  if (!id) return false;
  if (isDbAvailable()) {
    try {
      const ev = await prisma.stripeEvent.findUnique({ where: { id } }).catch(() => null);
      if (ev !== null) return Boolean(ev?.processed);
    } catch (e) {
      // Fall through to file store
    }
  }
  return fileStore.isProcessed(id);
}

export async function markEventProcessed(id, type = 'unknown') {
  if (!id) return;
  if (isDbAvailable()) {
    try {
      await prisma.stripeEvent.upsert({
        where: { id },
        update: { processed: true },
        create: { id, type, processed: true },
      });
      return;
    } catch (e) {
      console.warn('prisma.markEventProcessed fallback:', e.message);
    }
  }
  fileStore.markProcessed(id);
}

export async function getSubscriptionByEmail(email) {
  if (!email) return null;
  if (isDbAvailable()) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { subscription: true },
      });
      if (user) {
        const sub = user.subscription;
        return {
          plan: sub?.plan || 'free',
          status: sub?.status || 'inactive',
          isPro: sub?.plan === 'pro',
          currentPeriodEnd: sub?.currentPeriodEnd || null,
        };
      }
    } catch (e) {
      console.warn('prisma.getSubscriptionByEmail fallback:', e.message);
    }
  }
  // dev stub: no DB or user not found
  return { plan: 'free', status: 'inactive', isPro: false, currentPeriodEnd: null };
}

export async function upsertUserAndSubscription({ email, stripeCustomerId, stripeSub }) {
  if (!email) throw new Error('email_required');

  if (isDbAvailable()) {
    try {
      // upsert user
      const user = await prisma.user.upsert({
        where: { email },
        update: { stripeCustomerId: stripeCustomerId || undefined },
        create: { email, stripeCustomerId: stripeCustomerId || undefined },
      });

      // upsert subscription
      if (stripeSub) {
        const data = {
          userId: user.id,
          stripeSubId: stripeSub.id,
          plan: stripeSub.metadata?.plan || stripeSub.items?.data?.[0]?.price?.nickname || 'pro',
          status: stripeSub.status,
          currentPeriodEnd: new Date((stripeSub.current_period_end || 0) * 1000),
        };

        await prisma.subscription.upsert({
          where: { userId: user.id },
          update: { ...data, updatedAt: new Date() },
          create: data,
        });
      }

      return true;
    } catch (e) {
      console.warn('prisma.upsertUserAndSubscription fallback:', e.message);
      return false;
    }
  }

  // dev fallback: no-op
  return false;
}

export default {
  isDbAvailable,
  isEventProcessed,
  markEventProcessed,
  getSubscriptionByEmail,
  upsertUserAndSubscription,
};
