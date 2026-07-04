'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { stageFromTransaction, STAGE_INDEX, type FulfillmentStage } from '@/utils/trackingLinks';

const STEPS: { key: FulfillmentStage; label: string }[] = [
  { key: 'accepted', label: 'Accepted' },
  { key: 'escrow', label: 'Paid' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

/**
 * DoorDash-style horizontal progress bar for an order's fulfillment.
 * Reads the stage straight from the transaction (accepted → paid → shipped →
 * delivered) so buyer and seller always see the same status.
 */
export default function FulfillmentTracker({ transaction }: { transaction: any }) {
  const current = STAGE_INDEX[stageFromTransaction(transaction)];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', margin: '0.25rem 0 1.25rem' }}>
      {STEPS.map((step, i) => {
        const reached = i <= current;
        const active = i === current;
        return (
          <React.Fragment key={step.key}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto', width: 56 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: reached ? 'var(--success-green, #1d9e75)' : 'var(--bg-surface)',
                  border: reached ? 'none' : '2px solid var(--border-light)',
                  color: reached ? '#fff' : 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  boxShadow: active ? '0 0 0 4px rgba(29,158,117,0.15)' : 'none',
                }}
              >
                {i < current ? <Check size={16} /> : i + 1}
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  marginTop: '0.4rem',
                  color: active ? 'var(--primary-navy)' : 'var(--text-secondary)',
                  fontWeight: active ? 700 : 500,
                  textAlign: 'center',
                }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: i < current ? 'var(--success-green, #1d9e75)' : 'var(--border-light)',
                  marginTop: 13,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
