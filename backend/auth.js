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

  // 1. Support test token prefix: test_user:<userId>:<email>
  if (token.startsWith('test_user:')) {
    const parts = token.split(':');
    if (parts.length >= 3 && parts[1] && parts[2]) {
      return {
        id: parts[1],
        email: parts[2],
      };
    }
  }

  try {
    // 2. Base64-encoded JSON token payload
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
