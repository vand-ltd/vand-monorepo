import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsReady(true);
    }
  }, [router]);

  if (!isReady) {
    return null; // or a loading spinner
  }

  return <>{children}</>;
}