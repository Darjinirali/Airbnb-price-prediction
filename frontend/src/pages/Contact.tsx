import { useState } from 'react';
import { Send } from 'lucide-react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const S = {
  page: { 
    paddingTop: 68, 
    minHeight: '100vh', 
    background: '#fff', 
    fontFamily: "-apple-system, 'Circular Std', sans-serif" 
  } as React.CSSProperties,

  serif: { 
    fontFamily: "'Playfair Display', serif" 
  } as React.CSSProperties,

  secLabel: { 
    fontSize: 11, 
    fontWeight: 700, 
    letterSpacing: '1.5px', 
    textTransform: 'uppercase' as const, 
    color: '#FF385C', 
    marginBottom: 8 
  } as React.CSSProperties,

  input: {
    width: '100%', 
    border: '1.5px solid #EBEBEB', 
    borderRadius: 8,
    padding: '12px 14px', 
    fontSize: 14, 
    fontFamily: 'inherit',
    color: '#222', 
    outline: 'none', 
    background: '#fff', 
    transition: 'border 0.15s',
  } as React.CSSProperties,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ 
        display: 'block', 
        fontSize: 11, 
        fontWeight: 700, 
        marginBottom: 7, 
        color: '#444', 
        letterSpacing: '0.3px', 
        textTransform: 'uppercase' 
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<Status>('idle');

  const set = (k: keyof typeof form) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.email || !form.message) {
      alert("Name, Email aur Message fill karna zaroori hai!");
      return;
    }

    setStatus('sending');

    try {
      const res = await fetch('https://formspree.io/f/maqlqawd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus('sent');
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error("Form submission error:", err);
      setStatus('error');
    }
  };

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#FF385C';
  };

  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#EBEBEB';
  };

  return (
    <div style={S.page}>

      {/* Hero */}
      <section style={{
        padding: '100px 24px 80px',
        background: 'linear-gradient(160deg,#1C1C1E 0%,#2C2C2E 55%,#1C1C1E 100%)',
        textAlign: 'center', 
        position: 'relative', 
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, background: '#fff', clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
        
        <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 8, 
            background: 'rgba(255,255,255,0.1)', 
            border: '1px solid rgba(255,255,255,0.15)', 
            borderRadius: 20, 
            padding: '7px 16px', 
            fontSize: 13, 
            color: 'rgba(255,255,255,0.8)', 
            marginBottom: 24, 
            fontWeight: 500 
          }}>
            <span style={{ width: 6, height: 6, background: '#34D399', borderRadius: '50%', display: 'inline-block', animation: 'blink 2s infinite' }} />
            Get In Touch
          </div>
          <h1 style={{ 
            ...S.serif, 
            fontSize: 'clamp(32px, 5vw, 52px)', 
            color: '#fff', 
            lineHeight: 1.2, 
            margin: '0 0 16px' 
          }}>
            We'd love to <span style={{ color: '#FF385C' }}>hear from you</span>
          </h1>
          <p style={{ 
            color: 'rgba(255,255,255,0.55)', 
            fontSize: 17, 
            maxWidth: 420, 
            margin: '0 auto', 
            lineHeight: 1.7 
          }}>
            Questions about your estimate? Feedback? Bug report? Drop us a message.
          </p>
        </div>
      </section>

      {/* Body */}
      <div style={{ 
        maxWidth: 1040, 
        margin: '0 auto', 
        padding: '60px 24px', 
        display: 'grid', 
        gridTemplateColumns: '1fr 1.6fr', 
        gap: 48, 
        alignItems: 'start' 
      }}>

        {/* Left sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* About card */}
          <div style={{ border: '1.5px solid #EBEBEB', borderRadius: 16, padding: '24px 22px' }}>
            <p style={S.secLabel}>About StayWorth</p>
            <p style={{ color: '#717171', fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>
              StayWorth is an AI-powered rental price estimator built to help Airbnb hosts make smarter pricing decisions — instantly.
            </p>
            {[
              { icon: '✉', label: 'contact@stayworth.app' },
              { icon: '📍', label: 'Built with ❤️ in India' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ 
                  width: 36, 
                  height: 36, 
                  background: '#F7F7F7', 
                  border: '1.5px solid #EBEBEB', 
                  borderRadius: 10, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: 15, 
                  flexShrink: 0 
                }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: 13, color: '#717171' }}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Portfolio links */}
          <div style={{ border: '1.5px solid #EBEBEB', borderRadius: 16, padding: '24px 22px' }}>
            <p style={S.secLabel}>Portfolio Links</p>
            {[
              { icon: 'GH', label: 'View on GitHub', href: 'https://github.com' },
              { icon: 'in', label: 'Connect on LinkedIn', href: 'https://linkedin.com' },
            ].map(link => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  textDecoration: 'none', 
                  color: '#717171', 
                  fontSize: 13, 
                  padding: '8px 0', 
                  transition: 'color 0.15s' 
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#FF385C')}
                onMouseLeave={e => (e.currentTarget.style.color = '#717171')}
              >
                <div style={{ 
                  width: 36, 
                  height: 36, 
                  background: '#F7F7F7', 
                  border: '1.5px solid #EBEBEB', 
                  borderRadius: 10, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: 12, 
                  fontWeight: 700, 
                  color: '#444', 
                  flexShrink: 0 
                }}>
                  {link.icon}
                </div>
                {link.label}
              </a>
            ))}
          </div>

          {/* Tech stack */}
          <div style={{ background: '#222', borderRadius: 16, padding: '24px 22px' }}>
            <p style={{ 
              fontSize: 11, 
              fontWeight: 700, 
              letterSpacing: '1.5px', 
              textTransform: 'uppercase', 
              color: 'rgba(255,56,92,0.8)', 
              marginBottom: 14 
            }}>Built With</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['React', 'TypeScript', 'Tailwind CSS', 'Flask', 'scikit-learn', 'Python'].map(t => (
                <span key={t} style={{ 
                  fontSize: 12, 
                  background: 'rgba(255,255,255,0.07)', 
                  color: 'rgba(255,255,255,0.6)', 
                  padding: '3px 10px', 
                  borderRadius: 10, 
                  border: '1px solid rgba(255,255,255,0.1)' 
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Form / Success */}
        {status === 'sent' ? (
          <div style={{ border: '1.5px solid #EBEBEB', borderRadius: 20, padding: '80px 40px', textAlign: 'center' }}>
            <div style={{ 
              width: 52, 
              height: 52, 
              background: '#ECFDF5', 
              borderRadius: 12, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 16px', 
              fontSize: 24 
            }}>✓</div>
            <h2 style={{ ...S.serif, fontSize: 28, fontWeight: 700, color: '#222', margin: '0 0 8px' }}>Message sent!</h2>
            <p style={{ color: '#717171', fontSize: 14, margin: '0 0 24px', lineHeight: 1.7 }}>
              Thanks for reaching out. We'll get back to you within 24 hours.
            </p>
            <button
              onClick={() => { 
                setStatus('idle'); 
                setForm({ name: '', email: '', subject: '', message: '' }); 
              }}
              style={{ 
                background: '#FF385C', 
                color: '#fff', 
                border: 'none', 
                padding: '12px 28px', 
                borderRadius: 22, 
                fontSize: 14, 
                fontWeight: 700, 
                cursor: 'pointer', 
                fontFamily: 'inherit' 
              }}
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ border: '1.5px solid #EBEBEB', borderRadius: 20, padding: '40px 36px' }}>
            <p style={S.secLabel}>Contact Form</p>
            <h2 style={{ ...S.serif, fontSize: 28, fontWeight: 700, color: '#222', margin: '0 0 28px' }}>Send a message</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Your name">
                <input 
                  type="text" 
                  placeholder="Rahul Sharma" 
                  value={form.name} 
                  onChange={set('name')} 
                  required 
                  style={S.input} 
                  onFocus={onFocus} 
                  onBlur={onBlur} 
                />
              </Field>
              <Field label="Email address">
                <input 
                  type="email" 
                  placeholder="rahul@example.com" 
                  value={form.email} 
                  onChange={set('email')} 
                  required 
                  style={S.input} 
                  onFocus={onFocus} 
                  onBlur={onBlur} 
                />
              </Field>
            </div>

            <Field label="Subject">
              <select 
                value={form.subject} 
                onChange={set('subject')} 
                style={S.input} 
                onFocus={onFocus} 
                onBlur={onBlur}
              >
                <option value="">Select a topic...</option>
                <option value="estimate">Question about my estimate</option>
                <option value="bug">Bug report</option>
                <option value="feature">Feature suggestion</option>
                <option value="general">General feedback</option>
                <option value="other">Other</option>
              </select>
            </Field>

            <Field label="Message">
              <textarea 
                rows={5} 
                placeholder="Tell us what's on your mind..." 
                value={form.message} 
                onChange={set('message')} 
                required 
                style={{ ...S.input, resize: 'none' }} 
                onFocus={onFocus} 
                onBlur={onBlur} 
              />
            </Field>

            {status === 'error' && (
              <p style={{ 
                fontSize: 13, 
                color: '#C0392B', 
                background: '#FEF2F2', 
                border: '1px solid #FECACA', 
                borderRadius: 8, 
                padding: '10px 14px', 
                marginBottom: 16 
              }}>
                Something went wrong. Please try again.
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              style={{ 
                width: '100%', 
                background: status === 'sending' ? '#717171' : '#FF385C', 
                color: '#fff', 
                border: 'none', 
                padding: 15, 
                borderRadius: 10, 
                fontSize: 15, 
                fontWeight: 700, 
                cursor: status === 'sending' ? 'not-allowed' : 'pointer', 
                fontFamily: 'inherit', 
                transition: 'background 0.15s', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 8 
              }}
              onMouseEnter={e => { if (status !== 'sending') e.currentTarget.style.background = '#E31C5F'; }}
              onMouseLeave={e => { if (status !== 'sending') e.currentTarget.style.background = '#FF385C'; }}
            >
              {status === 'sending' ? (
                <><div style={{ 
                  width: 16, 
                  height: 16, 
                  border: '2px solid rgba(255,255,255,0.4)', 
                  borderTopColor: '#fff', 
                  borderRadius: '50%', 
                  animation: 'spin 0.7s linear infinite' 
                }} /> Sending...</>
              ) : (
                <><Send size={15} /> Send Message</>
              )}
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#B0B0B0', marginTop: 10 }}>We typically respond within 24 hours.</p>
          </form>
        )}
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes spin  { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}