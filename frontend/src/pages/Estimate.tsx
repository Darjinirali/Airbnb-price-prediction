import { useState } from 'react';
import axios from 'axios';
import { Plus, Minus, Loader2, TrendingUp, BarChart2, RefreshCw } from 'lucide-react';
import { API } from '../context/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────
interface FormState {
  city: string;
  neighbourhood: string;
  property_type: string;
  room_type: string;
  accommodates: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  review_scores_rating: number;
  number_of_reviews: number;
  cancellation_policy: string;
  cleaning_fee: number;
  name: string;
  amenities: string[];
}

interface Result {
  nightly_rate: number;
  low: number;
  high: number;
  total: number;
}

interface GraphData {
  city_comparison: { city: string; price: number }[];
  bedrooms_vs_price: { bedrooms: number; price: number }[];
  accommodates_vs_price: { accommodates: number; price: number }[];
  amenity_impact: { amenity: string; price: number; impact: number }[];
  room_type_prices: { room: string; price: number }[];
}

// ─── Mini bar chart ──────────────────────────────────────────────────────────
function BarChart({
  data, labelKey, valueKey, color = '#dc2626', highlight
}: {
  data: any[]; labelKey: string; valueKey: string;
  color?: string; highlight?: string | number;
}) {
  const max = Math.max(...data.map(d => d[valueKey]));
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-28 truncate shrink-0">{d[labelKey]}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div
              className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-700"
              style={{
                width: `${(d[valueKey] / max) * 100}%`,
                backgroundColor: d[labelKey] === highlight || d[valueKey] === highlight ? '#dc2626' : color,
                opacity: d[labelKey] === highlight || d[valueKey] === highlight ? 1 : 0.55,
              }}
            >
              <span className="text-white text-xs font-bold">${d[valueKey]}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Stepper ─────────────────────────────────────────────────────────────────
function Stepper({
  label, value, onDec, onInc, step = 1
}: { label: string; value: number; onDec: () => void; onInc: () => void; step?: number }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2 text-gray-800">{label}</label>
      <div className="flex items-center border border-gray-200 rounded-2xl px-4 py-3.5 bg-gray-50 focus-within:border-red-400 focus-within:bg-white transition-all">
        <button
          onClick={onDec}
          className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
        >
          <Minus size={18} />
        </button>
        <span className="flex-1 text-center text-xl font-bold text-gray-900">{value}</span>
        <button
          onClick={onInc}
          className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function Estimate() {
  const [form, setForm] = useState<FormState>({
    city: 'NYC', neighbourhood: '', property_type: 'Apartment',
    room_type: 'Entire home/apt', accommodates: 4, bedrooms: 1,
    beds: 2, bathrooms: 1.0, review_scores_rating: 92,
    number_of_reviews: 14, cancellation_policy: 'strict',
    cleaning_fee: 1, name: 'Beautiful apartment', amenities: ['wifi','ac','kitchen'],
  });

  const [result, setResult]     = useState<Result | null>(null);
  const [graphs, setGraphs]     = useState<GraphData | null>(null);
  const [loading, setLoading]   = useState(false);
  const [graphLoading, setGraphLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'city' | 'beds' | 'accom' | 'amenity' | 'room'>('city');
  const [error, setError]       = useState('');

  const AMENITIES = ['wifi','ac','kitchen','tv','washer','parking','gym','pool','elevator','doorman','pets','breakfast'];

  const update = (key: keyof FormState, val: any) =>
    setForm(p => ({ ...p, [key]: val }));

  const changeNum = (key: keyof FormState, inc: number) =>
    setForm(p => {
      let v = (p[key] as number) + inc;
      if (key === 'accommodates')   v = Math.max(1, Math.min(16, v));
      if (key === 'bedrooms')       v = Math.max(0, Math.min(10, v));
      if (key === 'beds')           v = Math.max(1, Math.min(16, v));
      if (key === 'bathrooms')      v = Math.max(0.5, Math.min(8, v));
      return { ...p, [key]: v };
    });

  const toggleAmenity = (a: string) =>
    setForm(p => ({
      ...p,
      amenities: p.amenities.includes(a) ? p.amenities.filter(x => x !== a) : [...p.amenities, a],
    }));

  const handlePredict = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/predict`, form);
      const n = res.data.nightly_rate;
      setResult({
        nightly_rate: n,
        low: Math.round(n * 0.85),
        high: Math.round(n * 1.18),
        total: Math.round(n * 7),
      });

      // Save data + fetch graphs
      await axios.post(`${API}/save_data`, { ...form, predicted_price: n });
      fetchGraphs();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Backend error — make sure Flask is running on :5000');
    } finally {
      setLoading(false);
    }
  };

  const fetchGraphs = async () => {
    setGraphLoading(true);
    try {
      const res = await axios.post(`${API}/graphs`, form);
      setGraphs(res.data);
    } catch {}
    finally { setGraphLoading(false); }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="pt-16 min-h-screen grid grid-cols-1 lg:grid-cols-12">
      {/* ════ LEFT: Form ════ */}
      <div className="lg:col-span-7 p-8 lg:p-14 bg-white overflow-auto">
        <h1 className="text-4xl font-black mb-1.5 text-gray-900">Get your estimate</h1>
        <p className="text-gray-500 mb-12">Fill in your property details below.</p>

        <div className="space-y-10">
          {/* Location */}
          <div>
            <h3 className="section-label">Location</h3>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="field-label">City</label>
                <select
                  value={form.city}
                  onChange={e => update('city', e.target.value)}
                  className="field-select"
                >
                  <option value="NYC">New York City</option>
                  <option value="LA">Los Angeles</option>
                  <option value="Chicago">Chicago</option>
                  <option value="SF">San Francisco</option>
                  <option value="Miami">Miami</option>
                </select>
              </div>
              <div>
                <label className="field-label">Neighbourhood <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={form.neighbourhood}
                  onChange={e => update('neighbourhood', e.target.value)}
                  placeholder="e.g. Brooklyn Heights"
                  className="field-input"
                />
              </div>
            </div>
          </div>

          {/* Property */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="field-label">Property Type</label>
              <select value={form.property_type} onChange={e => update('property_type', e.target.value)} className="field-select">
                <option>Apartment</option>
                <option>House</option>
                <option>Loft</option>
                <option>Villa</option>
              </select>
            </div>
            <div>
              <label className="field-label">Room Type</label>
              <select value={form.room_type} onChange={e => update('room_type', e.target.value)} className="field-select">
                <option value="Entire home/apt">Entire home / apt</option>
                <option value="Private room">Private room</option>
                <option value="Shared room">Shared room</option>
              </select>
            </div>
          </div>

          {/* Size */}
          <div>
            <h3 className="section-label">Size & Configuration</h3>
            <div className="grid grid-cols-2 gap-5">
              <Stepper label="Guests"    value={form.accommodates} onDec={() => changeNum('accommodates',-1)} onInc={() => changeNum('accommodates',1)} />
              <Stepper label="Bedrooms"  value={form.bedrooms}    onDec={() => changeNum('bedrooms',-1)}    onInc={() => changeNum('bedrooms',1)} />
              <Stepper label="Beds"      value={form.beds}        onDec={() => changeNum('beds',-1)}        onInc={() => changeNum('beds',1)} />
              <Stepper label="Bathrooms" value={form.bathrooms}   onDec={() => changeNum('bathrooms',-1)} onInc={() => changeNum('bathrooms',1)} step={1} />
            </div>
          </div>

          

        

          {/* Amenities */}
          <div>
            <h3 className="section-label">Amenities</h3>
            <div className="grid grid-cols-3 gap-3">
              {AMENITIES.map(a => (
                <button
                  key={a}
                  onClick={() => toggleAmenity(a)}
                  className={`border rounded-2xl py-3.5 px-4 text-left text-sm capitalize transition-all font-medium ${
                    form.amenities.includes(a)
                      ? 'border-red-500 bg-red-50 text-red-600'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 font-medium">
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-bold py-5 rounded-2xl text-lg transition-all flex items-center justify-center gap-3"
          >
            {loading && <Loader2 size={20} className="animate-spin" />}
            {loading ? 'Calculating...' : 'See My Estimate →'}
          </button>
        </div>
      </div>

      {/* ════ RIGHT: Result + Graphs ════ */}
      <div className="lg:col-span-5 bg-gray-50 p-8 lg:p-12 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] overflow-auto">
        {!result ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
            <div className="text-8xl mb-6">🏠</div>
            <p className="text-xl font-medium text-gray-500">Fill the form and click<br /><span className="text-red-500">"See My Estimate"</span></p>
            <p className="text-sm mt-3 text-gray-400">We'll show you graphs too!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── Price Card ── */}
            <div className="bg-black text-white rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="opacity-60" />
                <span className="uppercase text-xs tracking-widest opacity-60">Estimated Nightly Rate</span>
              </div>
              <div className="text-7xl font-black mt-3 mb-1">${result.nightly_rate}</div>
              <div className="text-sm opacity-50">per night · USD</div>

              <div className="grid grid-cols-3 gap-4 mt-10 pt-6 border-t border-white/10 text-center">
                <div>
                  <div className="text-3xl font-black">7</div>
                  <div className="text-xs opacity-50 mt-1 uppercase tracking-wide">nights</div>
                </div>
                <div>
                  <div className="text-3xl font-black">${result.total}</div>
                  <div className="text-xs opacity-50 mt-1 uppercase tracking-wide">est. total</div>
                </div>
                <div>
                  <div className="text-3xl font-black">${result.low}–${result.high}</div>
                  <div className="text-xs opacity-50 mt-1 uppercase tracking-wide">range</div>
                </div>
              </div>
            </div>

            {/* ── Graphs ── */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <BarChart2 size={18} className="text-red-600" />
                  <span className="font-bold text-gray-900">Price Analytics</span>
                </div>
                <button
                  onClick={fetchGraphs}
                  disabled={graphLoading}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Refresh charts"
                >
                  <RefreshCw size={15} className={graphLoading ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Tab bar */}
              <div className="flex gap-1 mb-6 bg-gray-50 rounded-2xl p-1">
                {([
                  ['city','Cities'],
                  ['beds','Bedrooms'],
                  ['accom','Guests'],
                  ['amenity','Amenity'],
                  ['room','Room Type'],
                ] as [typeof activeTab, string][]).map(([tab, label]) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                      activeTab === tab
                        ? 'bg-white text-red-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {graphLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-red-500" />
                </div>
              ) : graphs ? (
                <div>
                  {activeTab === 'city' && (
                    <BarChart
                      data={graphs.city_comparison}
                      labelKey="city" valueKey="price"
                      highlight={form.city}
                    />
                  )}
                  {activeTab === 'beds' && (
                    <BarChart
                      data={graphs.bedrooms_vs_price}
                      labelKey="bedrooms" valueKey="price"
                      highlight={form.bedrooms}
                    />
                  )}
                  {activeTab === 'accom' && (
                    <BarChart
                      data={graphs.accommodates_vs_price}
                      labelKey="accommodates" valueKey="price"
                      highlight={form.accommodates}
                    />
                  )}
                  {activeTab === 'amenity' && (
                    <BarChart
                      data={graphs.amenity_impact.slice(0,6)}
                      labelKey="amenity" valueKey="impact"
                      color="#16a34a"
                    />
                  )}
                  {activeTab === 'room' && (
                    <BarChart
                      data={graphs.room_type_prices}
                      labelKey="room" valueKey="price"
                      highlight={form.room_type}
                    />
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">
                  Click "See My Estimate" to load charts
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
