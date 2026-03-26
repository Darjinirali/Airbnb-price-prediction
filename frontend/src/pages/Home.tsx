interface Props { onGetEstimate: () => void; }

const CITIES = [
  { name: 'Manhattan', price: '$192' },
  { name: 'Brooklyn',  price: '$127' },
  { name: 'Chicago',   price: '$101' },
  { name: 'San Francisco', price: '$218' },
  { name: 'Miami Beach', price: '$168' },
  { name: 'Los Angeles', price: '$180' },
  { name: 'Manhattan', price: '$192' },
  { name: 'Brooklyn',  price: '$127' },
];

export default function Home({ onGetEstimate }: Props) {
  return (
    <div className="pt-16">
      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white py-28 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 to-transparent pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 px-6 py-2.5 rounded-full mb-8">
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Free Rental Price Estimator • AI Powered</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-black leading-tight mb-6">
            What's your rental<br />property{' '}
            <span className="text-red-500">worth?</span>
          </h1>

          <p className="text-xl text-gray-300 max-w-lg mx-auto mb-10 leading-relaxed">
            Instant AI-powered price estimates for short-term rentals.
            No agent. No waiting. Just real data.
          </p>

          <button
            onClick={onGetEstimate}
            className="bg-red-600 hover:bg-red-700 active:scale-95 text-white text-lg font-bold px-12 py-4 rounded-full transition-all shadow-lg shadow-red-900/30 hover:shadow-red-900/50"
          >
            Get Free Estimate →
          </button>
        </div>
      </section>

      {/* ── City ticker ── */}
      <div className="bg-gray-50 py-3.5 border-b overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap text-sm text-gray-600">
          {CITIES.map((c, i) => (
            <span key={i} className="mx-8">
              {c.name} ·{' '}
              <strong className="text-gray-900 font-bold">{c.price}/night</strong>
            </span>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <p className="uppercase tracking-widest text-red-600 font-bold text-xs mb-3">
          How it works
        </p>
        <h2 className="text-4xl font-black mb-4">Get your estimate in minutes</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-16">
          No agent needed. No waiting. Just real pricing data.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: '01', title: 'Create a free account', desc: 'Sign up in seconds — no credit card needed.' },
            { n: '02', title: 'Tell us about your property', desc: 'Enter city, bedrooms, amenities and more.' },
            { n: '03', title: 'See your price estimate',  desc: 'Get accurate nightly rate + interactive charts.' },
          ].map(s => (
            <div
              key={s.n}
              className="group border border-gray-200 rounded-2xl p-10 hover:border-red-500 hover:shadow-lg hover:shadow-red-50 transition-all cursor-default text-left"
            >
              <div className="text-5xl font-black text-gray-100 mb-6 group-hover:text-red-100 transition-colors">
                {s.n}
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="bg-black text-white py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-8 text-center px-6">
          {[
            { stat: '2M+', label: 'Listings analysed' },
            { stat: '50+', label: 'US cities covered' },
            { stat: 'Free', label: 'Always free to use' },
          ].map(t => (
            <div key={t.stat}>
              <div className="text-5xl font-black">{t.stat}</div>
              <div className="text-sm text-gray-400 mt-2">{t.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing / Trust section ── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left — mock card */}
          <div className="bg-zinc-900 rounded-3xl p-8 text-white shadow-2xl">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-zinc-800 rounded-2xl p-5">
                <p className="text-xs text-zinc-400 uppercase tracking-widest mb-2">Est. Per Night</p>
                <p className="text-4xl font-black">$148</p>
              </div>
              <div className="bg-zinc-800 rounded-2xl p-5">
                <p className="text-xs text-zinc-400 uppercase tracking-widest mb-2">7-Night Total</p>
                <p className="text-4xl font-black">$1,036</p>
              </div>
            </div>
            <p className="text-xs text-zinc-400 uppercase tracking-widest mb-4">How You Compare Nearby</p>
            {[
              { label: 'Your estimate', price: '$148', pct: 72 },
              { label: 'Area average',  price: '$124', pct: 60 },
              { label: 'Top listings',  price: '$205', pct: 100 },
            ].map(r => (
              <div key={r.label} className="flex items-center gap-3 mb-3">
                <span className="text-sm text-zinc-300 w-32 shrink-0">{r.label}</span>
                <div className="flex-1 bg-zinc-700 rounded-full h-2">
                  <div className="h-2 rounded-full bg-red-500" style={{ width: `${r.pct}%` }} />
                </div>
                <span className="text-sm font-bold w-12 text-right">{r.price}</span>
              </div>
            ))}
          </div>

          {/* Right — copy */}
          <div>
            <p className="uppercase tracking-widest text-red-600 font-bold text-xs mb-3">Pricing Data</p>
            <h2 className="text-4xl font-black mb-6 leading-tight">
              Pricing data you can actually trust
            </h2>
            <p className="text-gray-500 mb-10 leading-relaxed">
              StayWorth analyses rental listings across the US to give you a realistic picture of
              what your property can earn — so you can set the right price from day one.
            </p>
            {[
              { icon: '📍', title: 'Hyper-local pricing',  desc: 'Estimates are tailored to your specific neighbourhood, not just the city.' },
              { icon: '📅', title: 'Date-aware estimates', desc: 'Prices shift with seasons and local demand. We factor that in automatically.' },
              { icon: '🔄', title: 'Always up to date',    desc: 'Our pricing engine updates continuously as new listings are entered.' },
            ].map(f => (
              <div key={f.title} className="flex gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-lg shrink-0">{f.icon}</div>
                <div>
                  <p className="font-bold text-gray-900 mb-0.5">{f.title}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="uppercase tracking-widest text-red-600 font-bold text-xs mb-3">What Hosts Say</p>
            <h2 className="text-4xl font-black">Trusted by hosts nationwide</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { stars: 5, initials: 'SR', name: 'Samira R.',  location: 'Brooklyn, New York',  text: '"I had no idea what to charge for my Brooklyn apartment. StayWorth gave me a number in under a minute — and it was spot on compared to what I actually ended up listing for."' },
              { stars: 5, initials: 'JK', name: 'James K.',   location: 'Chicago, Illinois',   text: '"Super easy to use. I ran estimates for three different room configurations before deciding to list the whole apartment. Saved me a lot of guesswork."' },
              { stars: 4, initials: 'TM', name: 'Tanya M.',   location: 'Miami, Florida',      text: '"The nightly breakdown and comparison chart were really helpful. I ended up pricing slightly above the estimate and still filled my calendar."' },
            ].map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < t.stars ? 'text-amber-400' : 'text-gray-200'}>★</span>
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6">{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl font-black mb-4">Ready to price your property?</h2>
        <p className="text-gray-500 mb-8">
          Join thousands of hosts who use StayWorth to maximize their rental income.
        </p>
        <button
          onClick={onGetEstimate}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-12 py-4 rounded-full text-lg transition-all shadow-lg"
        >
          Get Started — It's Free
        </button>
      </section>
    </div>
  );
}