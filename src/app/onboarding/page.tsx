'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type Question = {
  id: string;
  prompt: string;
  subtitle?: string;
  type: 'single' | 'multi';
  options: string[];
};

// A short, role-aware survey. Buyers and sellers get different questions; the
// "how did you hear about us" question is shared. Answers are saved to the
// user's auth metadata (no DB migration needed) and the user is then routed to
// their destination — dashboard for buyers, Stripe onboarding for sellers.
function questionsForRole(role: 'buyer' | 'seller'): Question[] {
  const source: Question = {
    id: 'source',
    prompt: 'How did you hear about Surcal?',
    type: 'single',
    options: ['TikTok', 'Instagram', 'A friend', 'Google search', 'Reddit', 'Other'],
  };

  if (role === 'seller') {
    return [
      {
        id: 'sells',
        prompt: 'What do you sell?',
        subtitle: 'Pick all that apply.',
        type: 'multi',
        options: ['Sneakers', 'Electronics', 'Collectibles', 'Watches', 'Trading cards', 'Fashion', 'Other'],
      },
      {
        id: 'channels',
        prompt: 'Where do you sell today?',
        subtitle: 'Pick all that apply.',
        type: 'multi',
        options: ['eBay', 'StockX', 'Facebook / Marketplace', 'Instagram', 'In person', 'Nowhere yet'],
      },
      source,
    ];
  }

  return [
    {
      id: 'goal',
      prompt: 'What brings you to Surcal?',
      type: 'single',
      options: ['Find specific items', 'Get the best price', 'Sell my stuff too', 'Just exploring'],
    },
    {
      id: 'categories',
      prompt: 'What are you into?',
      subtitle: 'Pick all that apply.',
      type: 'multi',
      options: ['Sneakers', 'Electronics', 'Collectibles', 'Watches', 'Trading cards', 'Fashion', 'Other'],
    },
    source,
  ];
}

function OnboardingSurvey() {
  const searchParams = useSearchParams();
  const role: 'buyer' | 'seller' =
    searchParams.get('role') === 'seller' ? 'seller' : 'buyer';

  const questions = useMemo(() => questionsForRole(role), [role]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  const q = questions[index];
  const selected = answers[q.id] || [];
  const isLast = index === questions.length - 1;
  const finalHref = role === 'seller' ? '/seller/verify' : '/dashboard';
  const finalLabel = role === 'seller' ? 'Set up payouts' : 'Finish';

  const toggle = (option: string) => {
    setAnswers((prev) => {
      const current = prev[q.id] || [];
      if (q.type === 'single') {
        return { ...prev, [q.id]: [option] };
      }
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [q.id]: next };
    });
  };

  const finish = async (finalAnswers: Record<string, string[]>) => {
    setSaving(true);
    // Saving the survey is best-effort and nothing in the app reads the
    // `onboarded` flag, so a slow or hung updateUser call must never trap the
    // user on the final question. supabase-js serialises auth calls behind a
    // Web Locks lock, and our AuthProvider refetches the profile on the
    // USER_UPDATED event this very call emits — which can deadlock with no
    // timeout. Give the save a short window, then leave regardless.
    try {
      const supabase = createClient();
      await Promise.race([
        supabase.auth.updateUser({
          data: { onboarding_survey: finalAnswers, onboarded: true },
        }),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);
    } catch {
      // ignore — continue to the destination regardless
    }
    // Hard navigation so the server layout re-fetches the profile and the
    // destination's own guards run against fresh state (a soft router.push can
    // land on /dashboard before the client profile settles).
    window.location.href = finalHref;
  };

  const next = () => {
    if (isLast) {
      finish(answers);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const skip = () => (isLast ? finish(answers) : setIndex((i) => i + 1));

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-color)',
        padding: '80px 1.5rem 2rem',
      }}
    >
      <div
        className="glass-card"
        style={{ width: '100%', maxWidth: '520px', padding: '3rem 2.5rem' }}
      >
        {/* Progress */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: '0.9rem',
            }}
          >
            Question {index + 1} of {questions.length}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            {questions.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === index ? '28px' : '8px',
                  height: '8px',
                  borderRadius: '999px',
                  background: i <= index ? 'var(--primary-magenta)' : 'var(--border-light)',
                  transition: 'width 0.3s ease, background 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <h1
              className="heading-md"
              style={{ color: 'var(--primary-navy)', marginBottom: q.subtitle ? '0.4rem' : '1.75rem', textAlign: 'center' }}
            >
              {q.prompt}
            </h1>
            {q.subtitle && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.75rem' }}>
                {q.subtitle}
              </p>
            )}

            {/* Options */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem', justifyContent: 'center' }}>
              {q.options.map((option) => {
                const active = selected.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => toggle(option)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.7rem 1.1rem',
                      borderRadius: '999px',
                      border: `1.5px solid ${active ? 'var(--primary-magenta)' : 'var(--border-light)'}`,
                      background: active ? 'rgba(226, 37, 120, 0.08)' : 'var(--bg-surface)',
                      color: active ? 'var(--primary-magenta)' : 'var(--text-primary)',
                      fontWeight: active ? 700 : 500,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {active && <Check size={15} />}
                    {option}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Primary action */}
        <button
          onClick={next}
          disabled={selected.length === 0 || saving}
          className="button-primary"
          style={{
            width: '100%',
            padding: '1rem',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '1.05rem',
            marginTop: '2.25rem',
            opacity: selected.length === 0 || saving ? 0.5 : 1,
            cursor: selected.length === 0 || saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : isLast ? finalLabel : 'Next'} <ArrowRight size={18} />
        </button>

        {/* Skip */}
        <button
          onClick={skip}
          disabled={saving}
          style={{
            display: 'block',
            margin: '1rem auto 0',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  // useSearchParams requires a Suspense boundary in the App Router.
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-color)',
          }}
        >
          <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
        </div>
      }
    >
      <OnboardingSurvey />
    </Suspense>
  );
}
