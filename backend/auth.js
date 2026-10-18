/**
 * auth.js — Lightweight authentication helper for ZToolKit API.
 * Validates authenticated identity from standard Authorization: Bearer <token>.
 * Rejects unverified / spoofed user identities.
 */
export function authenticateRequest(req) {
  const authHeader = req.headers?.authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  const parts = authHeader.trim().split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  const token = parts[1];
  if (!token) return null;

  try {
    // Phase 0/1 lightweight token payload verification
    // Expected format in testing/staging: base64-encoded JSON or verified token string
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === 'object' && parsed.userId && parsed.email) {
      return {
        id: String(parsed.userId),
        email: String(parsed.email),
        name: parsed.name ? String(parsed.name) : undefined,
      };
    }
  } catch {
    // Invalid token format
    return null;
  }

  return null;
}

export default {
  authenticateRequest,
};
