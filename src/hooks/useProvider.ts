import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Provider, User } from '@/types/user';

function isProvider(user: User, expectedRole: Provider['role']): user is Provider {
  return (
    user &&
    typeof user === 'object' &&
    'role' in user &&
    user.role === expectedRole &&
    'address' in user &&
    'phone' in user &&
    'isActive' in user
  );
}

export function useProvider(id: string | undefined, expectedRole: Provider['role']) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getUserById(id)
      .then((user: User) => {
        if (isProvider(user, expectedRole)) {
          setProvider(user);
        } else {
          setError('Provider not found');
        }
      })
      .catch(() => setError('Provider not found'))
      .finally(() => setLoading(false));
  }, [id, expectedRole]);

  return { provider, loading, error };
} 