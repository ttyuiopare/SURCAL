'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// These two widgets mount on every page but are never above the fold — the
// assistant is a floating button and the share prompt is a conditional modal.
// Code-split them (ssr: false) and hold their mount until the browser is idle
// so they don't add to the initial JS the page needs to become interactive.
const SmartAssistantChat = dynamic(() => import('./SmartAssistantChat'), { ssr: false });
const SharePrompt = dynamic(() => import('./SharePrompt'), { ssr: false });

export default function DeferredWidgets() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
    };
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(() => setReady(true));
      return () => (window as unknown as { cancelIdleCallback?: (id: number) => void })
        .cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return null;

  return (
    <>
      <SmartAssistantChat />
      <SharePrompt />
    </>
  );
}
