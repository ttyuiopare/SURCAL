'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers/AuthProvider';

// Local feed: open requests from buyers in the same city, then same state.
// Buyer location comes from profiles (city set at sign-up or in Settings).
const FETCH_LIMIT = 300;

const norm = (s: unknown) => (typeof s === 'string' ? s.trim().toLowerCase() : '');

export default function LocalRequestsPage() {
  const { user, profile, supabase } = useAuth();
  const router = useRouter();

  const [loadingState, setLoadingState] = useState('Loading local requests...');
  const [sameCity, setSameCity] = useState<any[]>([]);
  const [sameState, setSameState] = useState<any[]>([]);
  const [cityInput, setCityInput] = useState('');
  const [savingCity, setSavingCity] = useState(false);

  const hasCity = !!profile?.city?.trim();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!profile) return; // profile still loading — effect re-runs when it lands

    if (!hasCity) {
      setLoadingState('no-city');
      return;
    }

    async function load() {
      const myProfile = profile;
      try {
        const { data, error } = await supabase
          .from('requests')
          .select('*, profiles!requests_buyer_id_fkey(name, city, state), categories(name)')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(FETCH_LIMIT);

        if (error) {
          setLoadingState('Database Error: ' + error.message);
          return;
        }

        const myCity = norm(myProfile!.city);
        const myState = norm(myProfile!.state);
        const inCity: any[] = [];
        const inState: any[] = [];
        for (const r of data || []) {
          // Never surface the user's own requests in the local feed.
          if (r.buyer_id === user!.id) continue;
          if (norm(r.profiles?.city) === myCity) inCity.push(r);
          else if (myState && norm(r.profiles?.state) === myState) inState.push(r);
        }
        setSameCity(inCity);
        setSameState(inState);
        setLoadingState('done');
      } catch (err: any) {
        setLoadingState('Error: ' + err.message);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  async function saveCity(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !cityInput.trim()) return;
    setSavingCity(true);
    const { error } = await supabase.from('profiles').update({ city: cityInput.trim() }).eq('id', user.id);
    setSavingCity(false);
    if (error) alert('Error saving city: ' + error.message);
    else window.location.reload();
  }

  if (loadingState === 'no-city') {
    return (
      <div style={{ minHeight: '100vh', padding: '120px var(--container-padding) 60px', backgroundColor: 'var(--bg-color)' }}>
        <div className="glass-card" style={{ maxWidth: '480px', margin: '4rem auto', padding: '2.5rem', textAlign: 'center' }}>
          <MapPin size={36} color="var(--primary-magenta)" style={{ margin: '0 auto 1rem' }} />
          <h1 className="heading-lg" style={{ fontSize: '1.6rem', marginBottom: '0.75rem' }}>Where are you?</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Add your city to see open requests from buyers near you.
          </p>
          <form onSubmit={saveCity} style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder="E.g. Austin"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              style={{ flex: 1, padding: '0.8rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-primary)' }}
            />
            <button type="submit" className="button-primary" disabled={savingCity} style={{ opacity: savingCity ? 0.7 : 1 }}>
              {savingCity ? 'Saving…' : 'Save'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loadingState !== 'done') {
    return (
      <div style={{ minHeight: '100vh', paddingTop: '120px', textAlign: 'center', color: loadingState.startsWith('Error') ? 'red' : 'inherit' }}>
        {loadingState}
      </div>
    );
  }

  const RequestCard = ({ req, i }: { req: any; i: number }) => (
    <motion.div
      className="glass-card list-row-hover"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i * 0.05, 0.5), duration: 0.3 }}
      style={{ padding: '1.5rem', cursor: 'pointer', borderLeft: '4px solid transparent' }}
      onClick={() => router.push(`/requests/${req.id}`)}
      onMouseEnter={(e) => (e.currentTarget.style.borderLeftColor = 'var(--primary-magenta)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderLeftColor = 'transparent')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <h3 style={{ fontSize: '1.3rem', margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontWeight: 600 }}>{req.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>${req.budget}</span>
          <span style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem', background: 'rgba(39, 174, 96, 0.1)', color: 'var(--success-green)', borderRadius: '20px', fontWeight: 600 }}>Open</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={16} /> Requested {new Date(req.created_at).toLocaleDateString()}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Tag size={16} /> {req.categories?.name || 'Other'}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary-magenta)', fontWeight: 600 }}>
          <MapPin size={16} /> {req.profiles?.city}{req.profiles?.state ? `, ${req.profiles.state}` : ''}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6 }}>
        {req.description}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.25rem' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Buyer: <strong>{req.profiles?.name || 'Private'}</strong></span>
        <button
          className="button-secondary"
          style={{ marginLeft: 'auto', padding: '0.4rem 1rem', fontSize: '0.9rem' }}
          onClick={(e) => { e.stopPropagation(); router.push(`/requests/${req.id}`); }}
        >
          View Item
        </button>
      </div>
    </motion.div>
  );

  return (
    <div style={{ minHeight: '100vh', padding: '120px var(--container-padding) 60px', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        <div style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '2rem' }}>
          <h1 className="heading-xl" style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <MapPin size={32} color="var(--primary-magenta)" /> Local
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Open requests from buyers in <strong>{profile?.city}{profile?.state ? `, ${profile.state}` : ''}</strong>.
            Change your city anytime in <a href="/settings" style={{ color: 'var(--primary-magenta)' }}>Settings</a>.
          </p>
        </div>

        <h2 className="heading-md" style={{ marginBottom: '1.25rem' }}>
          In your city <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({sameCity.length})</span>
        </h2>
        {sameCity.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px dashed var(--border-light)', marginBottom: '2.5rem' }}>
            No open requests in {profile?.city} right now — check the statewide list below.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
            {sameCity.map((req, i) => <RequestCard key={req.id} req={req} i={i} />)}
          </div>
        )}

        {sameState.length > 0 && (
          <>
            <h2 className="heading-md" style={{ marginBottom: '1.25rem' }}>
              Elsewhere in {profile?.state} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({sameState.length})</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sameState.map((req, i) => <RequestCard key={req.id} req={req} i={i} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
