'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type Question = {
  id: string;
  prompt: string;
  subtitle?: string;
  type: 'single' | 'multi' | 'text';
  options?: string[];
  placeholder?: string;
};

const CATEGORY_OPTIONS = [
  'Sneakers',
  'Electronics',
  'Collectibles',
  'Watches',
  'Trading cards',
  'Fashion',
  'Other',
];

const ACCOUNT_Q: Question = {
  id: 'account',
  prompt: 'Are you here to buy or sell?',
  subtitle: 'This shapes everything else we ask you.',
  type: 'single',
  options: ['Buy', 'Sell'],
};

const SELLER_TYPE_Q: Question = {
  id: 'sellerType',
  prompt: 'Are you selling as an individual or a business?',
  subtitle: 'Businesses get a public store page on Surcal.',
  type: 'single',
  options: ['Individual', 'Business'],
};

// The flow is built from the answers given so far: the first question decides
// buyer vs seller, the second (sellers only) decides individual vs business,
// and each path adds its own questions.
function buildFlow(answers: Record<string, string[]>): Question[] {
  const list: Question[] = [ACCOUNT_Q];
  const account = answers.account?.[0];
  if (!account) return list;

  if (account === 'Sell') {
    list.push(SELLER_TYPE_Q);
    const sellerType = answers.sellerType?.[0];
    if (sellerType === 'Business') {
      list.push(
        {
          id: 'businessName',
          prompt: "What's your business called?",
          subtitle: 'This names your public store page — you can change it later.',
          type: 'text',
          placeholder: 'e.g. Prime Kicks Co.',
        },
        {
          id: 'businessCategory',
          prompt: 'What does your business mainly sell?',
          type: 'single',
          options: CATEGORY_OPTIONS,
        },
        {
          id: 'volume',
          prompt: 'Roughly how many items do you sell per month?',
          type: 'single',
          options: ['1–5', '6–20', '21–50', '50+'],
        },
        {
          id: 'channels',
          prompt: 'Where do you sell today?',
          subtitle: 'Pick all that apply.',
          type: 'multi',
          options: ['eBay', 'StockX', 'Facebook / Marketplace', 'Instagram', 'Our own website', 'In person', 'Nowhere yet'],
        },
        {
          id: 'source',
          prompt: 'How did you hear about Surcal?',
          type: 'single',
          options: ['TikTok', 'Instagram', 'A friend', 'Google search', 'Reddit', 'Other'],
        },
      );
    } else if (sellerType === 'Individual') {
      list.push(
        {
          id: 'sells',
          prompt: 'What do you sell?',
          subtitle: 'Pick all that apply.',
          type: 'multi',
          options: CATEGORY_OPTIONS,
        },
        {
          id: 'experience',
          prompt: 'How long have you been selling?',
          type: 'single',
          options: ["I'm just starting out", 'Under a year', '1–3 years', '3+ years'],
        },
        {
          id: 'volume',
          prompt: 'Roughly how many items do you sell per month?',
          type: 'single',
          options: ['1–5', '6–20', '21–50', '50+'],
        },
        {
          id: 'channels',
          prompt: 'Where do you sell today?',
          subtitle: 'Pick all that apply.',
          type: 'multi',
          options: ['eBay', 'StockX', 'Facebook / Marketplace', 'Instagram', 'In person', 'Nowhere yet'],
        },
        {
          id: 'source',
          prompt: 'How did you hear about Surcal?',
          type: 'single',
          options: ['TikTok', 'Instagram', 'A friend', 'Google search', 'Reddit', 'Other'],
        },
      );
    }
  } else {
    list.push(
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
        options: CATEGORY_OPTIONS,
      },
      {
        id: 'budget',
        prompt: "What's your typical budget per item?",
        type: 'single',
        options: ['Under $100', '$100–$500', '$500–$1,000', '$1,000+', 'It varies'],
      },
      {
        id: 'frequency',
        prompt: 'How often do you shop for items like these?',
        type: 'single',
        options: ['Weekly', 'Monthly', 'A few times a year', 'This is my first time'],
      },
      {
        id: 'source',
        prompt: 'How did you hear about Surcal?',
        type: 'single',
        options: ['TikTok', 'Instagram', 'A friend', 'Google search', 'Reddit', 'Other'],
      },
    );
  }
  return list;
}

function destinationFor(answers: Record<string, string[]>): string {
  if (answers.account?.[0] === 'Sell') {
    return answers.sellerType?.[0] === 'Business' ? '/store' : '/seller/verify';
  }
  return '/dashboard';
}

function OnboardingSurvey() {
  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  // Returning users who already completed the survey skip straight to their
  // destination instead of seeing the questions a second time.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        const user = data.user;
        if (cancelled) return;
        if (!user) {
          window.location.href = '/login';
          return;
        }
        setUserId(user.id);
        if (user.user_metadata?.onboarded) {
          const role = user.user_metadata?.role === 'seller' ? 'seller' : 'buyer';
          window.location.replace(role === 'seller' ? '/seller' : '/dashboard');
          return;
        }
      } catch {
        // Fall through to the survey — it's still usable if detection fails.
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const questions = useMemo(() => buildFlow(answers), [answers]);
  const q = questions[Math.min(index, questions.length - 1)];
  const selected = answers[q.id] || [];
  // The branching questions (account, sellerType) always reveal more
  // questions, so they're never the last one even when they end the current
  // list — otherwise the button would say "Finish" mid-flow.
  const growsAfterAnswer = q.id === 'account' || q.id === 'sellerType';
  const isLast = !growsAfterAnswer && q.id === questions[questions.length - 1].id;
  const flowComplete = questions.length > 1;

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
    const account = finalAnswers.account?.[0] === 'Sell' ? 'seller' : 'buyer';
    const accountType =
      account === 'seller' && finalAnswers.sellerType?.[0] === 'Business'
        ? 'business'
        : 'individual';
    const businessName = finalAnswers.businessName?.[0];

    // Both saves are best-effort and nothing blocks on them, so a slow or hung
    // call must never trap the user on the final question.
    //
    // ORDER MATTERS: supabase.auth.updateUser() emits USER_UPDATED while still
    // holding supabase-js's internal auth lock; the AuthProvider handler then
    // wedges that lock and every LATER client-side call — including a profiles
    // update — never even starts, leaving finish() on "Saving…" forever. So
    // the plain-REST profile update runs FIRST, while the lock is free, the
    // metadata save goes second, and each is raced against a timer so the hard
    // navigation below can never be blocked.
    try {
      const supabase = createClient();
      if (userId) {
        const TIMED_OUT = Symbol('timed-out');
        const onboardedAt = new Date().toISOString();
        const fullUpdate: { error?: { message: string } | null } | typeof TIMED_OUT =
          await Promise.race([
            supabase
              .from('profiles')
              .update({
                role: account,
                account_type: accountType,
                ...(businessName ? { business_name: businessName } : {}),
                onboarded_at: onboardedAt,
              })
              .eq('id', userId),
            new Promise<typeof TIMED_OUT>((resolve) => setTimeout(() => resolve(TIMED_OUT), 4000)),
          ]);
        // A database without the business columns (migration 22 not applied
        // yet) rejects the whole row update on the unknown column — retry
        // with `role` alone, which exists in every schema version.
        if (fullUpdate !== TIMED_OUT && fullUpdate.error) {
          await Promise.race([
            supabase.from('profiles').update({ role: account }).eq('id', userId),
            new Promise((resolve) => setTimeout(resolve, 3000)),
          ]);
        }
      }
      await Promise.race([
        supabase.auth.updateUser({
          data: { role: account, onboarding_survey: finalAnswers, onboarded: true },
        }),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);
    } catch {
      // ignore — continue to the destination regardless
    }
    // Hard navigation so the server layout re-fetches the profile and the
    // destination's own guards run against fresh state (a soft router.push can
    // land on /dashboard before the client profile settles).
    window.location.href = destinationFor(finalAnswers);
  };

  const next = () => {
    if (isLast) {
      finish(answers);
    } else {
      setIndex((i) => i + 1);
    }
  };

  // Skip exits the survey entirely — with a branching flow you can't skip the
  // buyer/seller question and keep walking, so skipping means "just finish".
  const skip = () => finish(answers);

  const canContinue = q.type === 'text' ? (selected[0] ?? '').trim().length > 0 : selected.length > 0;

  if (checking) {
    return (
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
    );
  }

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
            Question {index + 1}{flowComplete ? ` of ${questions.length}` : ''}
          </p>
          {flowComplete && (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              {questions.map((question, i) => (
                <div
                  key={question.id}
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
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
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
            {q.type === 'text' ? (
              <input
                type="text"
                value={selected[0] ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setAnswers((prev) => ({ ...prev, [q.id]: value ? [value] : [] }));
                }}
                placeholder={q.placeholder}
                autoFocus
                maxLength={60}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '10px',
                  border: '1.5px solid var(--border-light)',
                  fontSize: '1.05rem',
                  textAlign: 'center',
                }}
              />
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem', justifyContent: 'center' }}>
                {q.options!.map((option) => {
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
            )}
          </motion.div>
        </AnimatePresence>

        {/* Primary action */}
        <button
          onClick={next}
          disabled={!canContinue || saving}
          className="button-primary"
          style={{
            width: '100%',
            padding: '1rem',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '1.05rem',
            marginTop: '2.25rem',
            opacity: !canContinue || saving ? 0.5 : 1,
            cursor: !canContinue || saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : isLast ? 'Finish' : 'Next'} <ArrowRight size={18} />
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
