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

function assertProductionSafety() {
  if (process.env.NODE_ENV === 'production' && !isDbAvailable()) {
    throw new Error('FATAL: Database connection required in production. File-store fallback is strictly prohibited.');
  }
}

export function computeSubscriptionState(sub) {
  if (!sub) {
    return {
      plan: 'free',
      status: 'inactive',
      isPro: false,
      currentPeriodEnd: null,
    };
  }

  const isProPlan = sub.plan === 'pro' || sub.plan === 'business';
  const isActiveStatus = sub.status === 'active' || sub.status === 'trialing';

  let currentPeriodEnd = null;
  let notExpired = true;

  if (sub.currentPeriodEnd) {
    const end = new Date(sub.currentPeriodEnd);
    if (!isNaN(end.getTime())) {
      currentPeriodEnd = end.toISOString();
      notExpired = end.getTime() > Date.now();
    } else {
      notExpired = false;
    }
  } else {
    // If no expiration was recorded, cannot verify valid active entitlement
    notExpired = false;
  }

  const isPro = Boolean(isProPlan && isActiveStatus && notExpired);

  return {
    plan: isPro ? sub.plan : 'free',
    status: sub.status || 'inactive',
    isPro,
    currentPeriodEnd,
  };
}

export async function isEventProcessed(id) {
  if (!id) return false;
  assertProductionSafety();

  if (isDbAvailable()) {
    try {
      const ev = await prisma.stripeEvent.findUnique({ where: { id } }).catch(() => null);
      if (ev !== null) return Boolean(ev?.processed);
    } catch (e) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Database idempotency check failed: ' + e.message);
      }
    }
  }
  return fileStore.isProcessed(id);
}

export async function markEventProcessed(id, type = 'unknown') {
  if (!id) return;
  assertProductionSafety();

  if (isDbAvailable()) {
    try {
      await prisma.stripeEvent.upsert({
        where: { id },
        update: { processed: true },
        create: { id, type, processed: true },
      });
      return;
    } catch (e) {
      console.warn('prisma.markEventProcessed error:', e.message);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Failed to record event idempotency: ' + e.message);
      }
    }
  }
  fileStore.markProcessed(id);
}

export async function getSubscriptionByUserId(userId) {
  if (!userId) return computeSubscriptionState(null);
  assertProductionSafety();

  if (isDbAvailable()) {
    try {
      const sub = await prisma.subscription.findUnique({
        where: { userId },
      });
      return computeSubscriptionState(sub);
    } catch (e) {
      console.warn('prisma.getSubscriptionByUserId error:', e.message);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Failed to retrieve user subscription: ' + e.message);
      }
    }
  }

  return computeSubscriptionState(null);
}

export async function getSubscriptionByEmail(email) {
  if (!email) return computeSubscriptionState(null);
  assertProductionSafety();

  if (isDbAvailable()) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { subscription: true },
      });
      if (user) {
        return computeSubscriptionState(user.subscription);
      }
    } catch (e) {
      console.warn('prisma.getSubscriptionByEmail error:', e.message);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Failed to retrieve subscription by email: ' + e.message);
      }
    }
  }
  return computeSubscriptionState(null);
}

export async function upsertUserAndSubscription({ email, stripeCustomerId, stripeSub }) {
  assertProductionSafety();

  if (isDbAvailable()) {
    try {
      let user = null;
      if (email) {
        user = await prisma.user.upsert({
          where: { email },
          update: { stripeCustomerId: stripeCustomerId || undefined },
          create: { email, stripeCustomerId: stripeCustomerId || undefined },
        });
      } else if (stripeCustomerId) {
        user = await prisma.user.findFirst({
          where: { stripeCustomerId },
        });
      }

      if (!user) {
        console.warn('upsertUserAndSubscription: user could not be resolved from email or customerId', { email, stripeCustomerId });
        return false;
      }

      // Upsert subscription
      if (stripeSub) {
        let currentPeriodEndDate;
        if (stripeSub.current_period_end instanceof Date) {
          currentPeriodEndDate = stripeSub.current_period_end;
        } else if (typeof stripeSub.current_period_end === 'number' && stripeSub.current_period_end > 0) {
          currentPeriodEndDate = new Date(stripeSub.current_period_end * 1000);
        } else if (typeof stripeSub.current_period_end === 'string') {
          currentPeriodEndDate = new Date(stripeSub.current_period_end);
        } else {
          currentPeriodEndDate = new Date();
        }

        const data = {
          userId: user.id,
          stripeSubId: stripeSub.id,
          plan: stripeSub.metadata?.plan || stripeSub.items?.data?.[0]?.price?.nickname || 'pro',
          status: stripeSub.status || 'inactive',
          currentPeriodEnd: currentPeriodEndDate,
        };

        await prisma.subscription.upsert({
          where: { userId: user.id },
          update: { ...data, updatedAt: new Date() },
          create: data,
        });
      }

      return true;
    } catch (e) {
      console.error('prisma.upsertUserAndSubscription error:', e.message);
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Database persistence failure: ' + e.message);
      }
      return false;
    }
  }

  // File store fallback prohibited for writing subscriptions
  return false;
}

export default {
  isDbAvailable,
  computeSubscriptionState,
  isEventProcessed,
  markEventProcessed,
  getSubscriptionByUserId,
  getSubscriptionByEmail,
  upsertUserAndSubscription,
};
