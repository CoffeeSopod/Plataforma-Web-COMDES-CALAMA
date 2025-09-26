import { useEffect, useState } from 'react';
import { getToken } from './auth';

export function useMe() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = getToken();

  useEffect(() => {
    let cancel = false;
    async function fetchMe() {
      try {
        setLoading(true);
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!cancel) setMe(res.ok ? data : null);
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    if (token) fetchMe(); else { setMe(null); setLoading(false); }
    return () => { cancel = true; };
  }, [token]);


  return { me, loading };
}
