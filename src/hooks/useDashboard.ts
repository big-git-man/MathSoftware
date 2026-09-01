import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { getDashboard, Dashboard } from '../services/dashboard';

export function useDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await getDashboard();
      setData(d);
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetch();
      return () => {};
    }, [fetch])
  );

  return { data, loading, error, refetch: fetch };
}
