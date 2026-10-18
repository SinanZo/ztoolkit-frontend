import { useEffect, useState } from 'react';
import { ENV } from '../config/env';

/**
 * useSubscription hook.
 * 
 * In Phase 0/pre-auth: always returns a safe, unprivileged Free state.
 * Never attempts to authorize or elevate privileges via unverified query parameters.
 * When real authentication is connected, forwards verified Authorization Bearer token.
 */
export default function useSubscription() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    plan: 'free',
    status: 'inactive',
    isPro: false,
    currentPeriodEnd: null,
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const base = ENV.API_BASE || window.location.origin;
        const url = new URL('/api/subscription', base);

        // Forward authenticated token if present in secure storage
        const token =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('ztoolkit_auth_token')
            : null;

        const headers = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(url.toString(), {
          headers,
          credentials: 'same-origin',
        });

        if (!res.ok) throw new Error('failed_fetch');
        const json = await res.json();
        if (!mounted) return;
        setData(json);
      } catch (err) {
        setError(err?.message || 'unknown');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { loading, error, ...data };
}
