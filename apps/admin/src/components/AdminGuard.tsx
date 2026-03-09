import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (!token) {
      router.push('/login');
    } else if (role !== 'admin') {
      router.push('/');
    } else {
      setIsReady(true);
    }
  }, [router]);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}
