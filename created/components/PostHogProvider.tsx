'use client';

import { useEffect } from 'react';
import posthog from '@/lib/instrumentation-client'; // your instrumentation-client.js file

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Optional: track a pageview manually
    posthog.capture('$pageview');
  }, []);

  return <>{children}</>;
}
