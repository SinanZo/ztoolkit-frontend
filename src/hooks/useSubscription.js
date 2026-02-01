import { useEffect, useState } from 'react';

// Simple read-only subscription hook. In prod this should be authenticated.
export default function useSubscription() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ plan: 'free', status: 'inactive', isPro: false });
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/subscription', { credentials: 'same-origin' });
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
