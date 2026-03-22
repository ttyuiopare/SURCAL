'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { DollarSign, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

export default function EarningsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ earned: 0, pending: 0, spent: 0 });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadFinancials() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Fetch all transactions involving this user (either buyer or seller)
      const { data: txs } = await supabase.from('transactions')
        .select('*, requests(title)')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (txs) {
        setTransactions(txs);
        
        let earned = 0;
        let pending = 0;
        let spent = 0;

        txs.forEach((tx) => {
          if (tx.buyer_id === user.id) {
            // Money leaving the user
            spent += Number(tx.amount);
          } else if (tx.seller_id === user.id) {
            // Money coming to the user
            if (tx.status === 'completed') earned += Number(tx.amount);
            if (tx.status === 'pending') pending += Number(tx.amount);
          }
        });

        setStats({ earned, pending, spent });
      }
      setLoading(false);
    }
    loadFinancials();
  }, [supabase, router]);

  if (loading) return <div style={{ minHeight: '100vh', paddingTop: '120px', textAlign: 'center' }}>Loading Financials...</div>;

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding) 60px', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(29, 158, 117, 0.1)', color: 'var(--success-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={24} />
          </div>
          <div>
            <h1 className="heading-lg" style={{ margin: 0 }}>Earnings & Financials</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Track your escrow payments, earnings, and expenses.</p>
          </div>
        </div>

        {/* Top KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          <div className="glass-card" style={{ padding: '2rem', borderTop: '4px solid var(--success-green)' }}>
            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Net Available Earned</p>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--text-primary)' }}>${stats.earned.toLocaleString()}</h2>
          </div>
          <div className="glass-card" style={{ padding: '2rem', borderTop: '4px solid var(--warning-orange)' }}>
            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Pending in Escrow (To You)</p>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--text-primary)' }}>${stats.pending.toLocaleString()}</h2>
          </div>
          <div className="glass-card" style={{ padding: '2rem', borderTop: '4px solid var(--primary-magenta)' }}>
            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Spent</p>
            <h2 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--text-primary)' }}>${stats.spent.toLocaleString()}</h2>
          </div>
        </div>

        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--primary-navy)' }}>Transaction History</h3>
        
        {transactions.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No transactions found. Build your history by completing projects.
          </div>
        ) : (
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>DATE</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>PROJECT</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>TYPE</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>STATUS</th>
                  <th style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'right' }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => {
                  const isIncoming = tx.seller_id === userId;
                  return (
                    <motion.tr 
                      key={tx.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      style={{ borderBottom: '1px solid var(--border-light)' }}
                    >
                      <td style={{ padding: '1.2rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1.2rem 1.5rem', fontSize: '0.9rem', color: 'var(--primary-navy)', fontWeight: 500 }}>
                        {tx.requests?.title || 'Unknown Order'}
                      </td>
                      <td style={{ padding: '1.2rem 1.5rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: isIncoming ? 'rgba(39, 174, 96, 0.1)' : 'rgba(229, 0, 125, 0.1)', color: isIncoming ? 'var(--success-green)' : 'var(--primary-magenta)' }}>
                          {isIncoming ? <><ArrowDownRight size={14} /> Received</> : <><ArrowUpRight size={14} /> Sent</>}
                        </span>
                      </td>
                      <td style={{ padding: '1.2rem 1.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: tx.status === 'completed' ? 'var(--text-secondary)' : 'var(--warning-orange)', fontWeight: 600, textTransform: 'uppercase' }}>
                          {tx.status === 'pending' ? 'In Escrow' : 'Cleared'}
                        </span>
                      </td>
                      <td style={{ padding: '1.2rem 1.5rem', fontSize: '1rem', fontWeight: 600, textAlign: 'right', color: isIncoming ? 'var(--success-green)' : 'var(--text-primary)' }}>
                        {isIncoming ? '+' : '-'}${tx.amount}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
