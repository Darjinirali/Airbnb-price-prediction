import { useState, useEffect } from 'react';
import { Clock, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export interface SavedEstimate {
  id: string;
  city: string;
  property_type: string;
  room_type: string;
  bedrooms: number;
  accommodates: number;
  nightly_rate: number;
  review_scores_rating: number;
  amenities: string[];
  savedAt: string;
}

// ─── Inline styles (matches StayWorth design exactly) ─────────────────────────
const S = {
  page: { paddingTop: 68, minHeight: '100vh', background: '#fff', fontFamily: "-apple-system, 'Circular Std', sans-serif" } as React.CSSProperties,
  inner: { maxWidth: 1040, margin: '0 auto', padding: '44px 24px' } as React.CSSProperties,
  secLabel: { fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#FF385C', marginBottom: 8 },
  serif: { fontFamily: "'Playfair Display', serif" } as React.CSSProperties,
  btnRed: { background: '#FF385C', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 22, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' } as React.CSSProperties,
};

function StatCard({ label, value, sub, dark = false }: { label: string; value: string; sub?: string; dark?: boolean }) {
  return (
    <div style={{ background: dark ? '#222' : '#F7F7F7', borderRadius: 10, padding: '16px 18px' }}>
      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: dark ? 'rgba(255,255,255,0.4)' : '#B0B0B0', marginBottom: 6 }}>{label}</p>
      <p style={{ ...S.serif, fontSize: 26, fontWeight: 700, color: dark ? '#fff' : '#222', lineHeight: 1, margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: dark ? 'rgba(255,255,255,0.3)' : '#B0B0B0', marginTop: 4, marginBottom: 0 }}>{sub}</p>}
    </div>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: '#717171', width: 100, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: '#EBEBEB', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: '#FF385C', borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#222', width: 64, textAlign: 'right' }}>${value}/night</span>
    </div>
  );
}

function EstimateCard({ estimate, onDelete }: { estimate: SavedEstimate; onDelete: (id: string) => void }) {
  const [hovered, setHovered] = useState(false);
  const timeAgo = (() => {
    const diff = Date.now() - new Date(estimate.savedAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  })();

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: hovered ? '1.5px solid transparent' : '1.5px solid #EBEBEB',
        boxShadow: hovered ? '0 2px 16px rgba(0,0,0,0.12)' : 'none',
        borderRadius: 14, padding: 18, background: '#fff', transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#222', margin: '0 0 4px' }}>{estimate.city}</p>
          <span style={{ fontSize: 10, background: '#FFF5F7', color: '#FF385C', padding: '2px 9px', borderRadius: 10, fontWeight: 600 }}>
            {estimate.property_type}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ ...S.serif, fontSize: 24, fontWeight: 700, color: '#222', lineHeight: 1, margin: 0 }}>${estimate.nightly_rate}</p>
          <p style={{ fontSize: 11, color: '#B0B0B0', margin: '2px 0 0' }}>per night</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#717171', borderTop: '1px solid #F7F7F7', paddingTop: 10, marginBottom: 10, alignItems: 'center' }}>
        <span>{estimate.bedrooms} beds</span>
        <span>{estimate.accommodates} guests</span>
        <span>★ {estimate.review_scores_rating}</span>
        <span style={{ marginLeft: 'auto', color: '#B0B0B0', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
          <Clock size={10} /> {timeAgo}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {estimate.amenities.slice(0, 3).map(a => (
            <span key={a} style={{ fontSize: 10, background: '#F7F7F7', color: '#717171', padding: '2px 8px', borderRadius: 8 }}>{a}</span>
          ))}
          {estimate.amenities.length > 3 && <span style={{ fontSize: 10, color: '#B0B0B0' }}>+{estimate.amenities.length - 3}</span>}
        </div>
        <button
          onClick={() => onDelete(estimate.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: hovered ? '#FF385C' : '#EBEBEB', padding: 4, transition: 'color 0.15s' }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export default function Dashboard({ onGoEstimate }: { onGoEstimate: () => void }) {
  const { user } = useAuth();
  const [estimates, setEstimates] = useState<SavedEstimate[]>([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const raw = localStorage.getItem(`sw_estimates_${user?.email}`);
    if (raw) { try { setEstimates(JSON.parse(raw)); } catch { setEstimates([]); } }
  }, [user]);

  const save = (data: SavedEstimate[]) => {
    localStorage.setItem(`sw_estimates_${user?.email}`, JSON.stringify(data));
    setEstimates(data);
  };

  const avgRate = estimates.length ? Math.round(estimates.reduce((s, e) => s + e.nightly_rate, 0) / estimates.length) : 0;
  const maxRate = estimates.length ? Math.max(...estimates.map(e => e.nightly_rate)) : 0;
  const cities = [...new Set(estimates.map(e => e.city))];
  const filtered = filter === 'All' ? estimates : estimates.filter(e => e.city === filter);
  const cityBreakdown = cities.map(c => {
    const ces = estimates.filter(e => e.city === c);
    return { city: c, avg: Math.round(ces.reduce((s, e) => s + e.nightly_rate, 0) / ces.length) };
  }).sort((a, b) => b.avg - a.avg);
  const chartMax = cityBreakdown.length ? Math.max(...cityBreakdown.map(c => c.avg)) : 200;

  const Pill = ({ label, active }: { label: string; active: boolean }) => (
    <button
      onClick={() => setFilter(label)}
      style={{
        border: `1.5px solid ${active ? '#FF385C' : '#EBEBEB'}`,
        background: active ? '#FF385C' : 'none',
        color: active ? '#fff' : '#717171',
        borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 500,
        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
      }}
    >{label}</button>
  );

  return (
    <div style={S.page}>
      <div style={S.inner}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <p style={S.secLabel}>Your Dashboard</p>
            <h1 style={{ ...S.serif, fontSize: 36, fontWeight: 700, color: '#222', margin: '0 0 6px' }}>
              Welcome back, {user?.name.split(' ')[0]} 👋
            </h1>
            <p style={{ color: '#717171', fontSize: 15, margin: 0 }}>
              {estimates.length === 0 ? 'No estimates yet — run your first one!' : `${estimates.length} estimate${estimates.length > 1 ? 's' : ''} saved`}
            </p>
          </div>
          <button
            onClick={onGoEstimate}
            style={S.btnRed}
            onMouseEnter={e => (e.currentTarget.style.background = '#E31C5F')}
            onMouseLeave={e => (e.currentTarget.style.background = '#FF385C')}
          >
            + New Estimate
          </button>
        </div>

        {estimates.length === 0 ? (
          <div style={{ border: '1.5px dashed #EBEBEB', borderRadius: 16, padding: '80px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 52, opacity: 0.3, marginBottom: 14 }}>🏠</div>
            <h2 style={{ ...S.serif, fontSize: 26, fontWeight: 700, color: '#222', margin: '0 0 10px' }}>No estimates yet</h2>
            <p style={{ color: '#717171', fontSize: 14, margin: '0 auto 24px', maxWidth: 280 }}>
              Run your first price estimate and it'll show up here automatically.
            </p>
            <button onClick={onGoEstimate} style={S.btnRed}>Get My First Estimate →</button>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
              <StatCard dark label="Avg nightly rate" value={`$${avgRate}`} sub="across all estimates" />
              <StatCard label="Highest rate" value={`$${maxRate}`} sub="your best estimate" />
              <StatCard label="Total estimates" value={`${estimates.length}`} sub="saved so far" />
              <StatCard label="Cities explored" value={`${cities.length}`} sub="different markets" />
            </div>

            {/* City chart */}
            {cityBreakdown.length > 1 && (
              <div style={{ background: '#fff', border: '1.5px solid #EBEBEB', borderRadius: 12, padding: '18px 20px', marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#B0B0B0', margin: '0 0 14px' }}>
                  Average rate by city
                </p>
                {cityBreakdown.map(c => <BarRow key={c.city} label={c.city} value={c.avg} max={chartMax} />)}
              </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              {['All', ...cities].map(c => <Pill key={c} label={c} active={filter === c} />)}
              <button
                onClick={() => { if (window.confirm('Sab estimates delete karo?')) save([]); }}
                style={{ marginLeft: 'auto', background: 'none', border: '1.5px solid #EBEBEB', color: '#B0B0B0', borderRadius: 20, padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <RefreshCw size={11} /> Clear all
              </button>
            </div>

            {/* Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
              {filtered.length === 0
                ? <p style={{ color: '#B0B0B0', fontSize: 13, gridColumn: 'span 3', padding: '32px 0', textAlign: 'center' }}>No estimates for {filter}.</p>
                : filtered.slice().sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()).map(e => (
                  <EstimateCard key={e.id} estimate={e} onDelete={id => save(estimates.filter(e => e.id !== id))} />
                ))
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Call this from Estimate.tsx after prediction ─────────────────────────────
export function saveToDashboard(userEmail: string, data: Omit<SavedEstimate, 'id' | 'savedAt'>) {
  const key = `sw_estimates_${userEmail}`;
  const existing: SavedEstimate[] = JSON.parse(localStorage.getItem(key) || '[]');
  const newEntry: SavedEstimate = { ...data, id: Date.now().toString(), savedAt: new Date().toISOString() };
  localStorage.setItem(key, JSON.stringify([newEntry, ...existing].slice(0, 50)));
}