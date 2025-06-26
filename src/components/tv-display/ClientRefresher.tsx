'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * This is a lightweight client component that simply forces a server-side
 * data refresh periodically, ensuring the TV panel stays up to date without
 * a full page reload.
 */
export default function ClientRefresher() {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh();
    }, REFRESH_INTERVAL_MS);

    // Cleanup the timer if the component is unmounted.
    return () => clearInterval(timer);
  }, [router]);

  return null; // This component renders nothing.
}
