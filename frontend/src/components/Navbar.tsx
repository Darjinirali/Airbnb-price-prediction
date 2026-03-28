import { useAuth } from '../context/AuthContext';

type Page = 'home' | 'estimate' | 'dashboard' | 'contact';

interface NavbarProps {
  onGoHome: () => void;
  onGoEstimate: () => void;
  onGoDashboard: () => void;
  onGoContact: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  activePage?: Page;
}

export default function Navbar({
  onGoHome, onGoEstimate, onGoDashboard, onGoContact,
  onOpenLogin, onOpenRegister, activePage,
}: NavbarProps) {
  const { user, logout } = useAuth();

  const navLink = (label: string, page: Page, onClick: () => void) => {
    const isActive = activePage === page;
    return (
      <button
        onClick={onClick}
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: isActive ? 700 : 500,
          color: isActive ? '#FF385C' : '#444',
          fontFamily: 'inherit',
          padding: '8px 12px',
          borderRadius: 20,
          transition: 'color 0.15s, background 0.15s',
          borderBottom: isActive ? '2px solid #FF385C' : '2px solid transparent',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#222'; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#444'; }}
      >
        {label}
      </button>
    );
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
      height: 68, background: 'rgba(255,255,255,0.97)',
      backdropFilter: 'blur(8px)', borderBottom: '1px solid #EBEBEB',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', fontFamily: "-apple-system, 'Circular Std', sans-serif",
    }}>
      {/* Logo */}
      <button
        onClick={onGoHome}
        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
      >
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#FF385C' }}>
          Stay<span style={{ color: '#222' }}>Worth</span>
        </span>
      </button>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {navLink('Home', 'home', onGoHome)}
        {navLink('Estimate', 'estimate', onGoEstimate)}
        {user && navLink('Dashboard', 'dashboard', onGoDashboard)}
        {navLink('Contact', 'contact', onGoContact)}
      </div>

      {/* Auth */}
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, background: '#FF385C', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>
              {user.name[0].toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#444', margin: 0, lineHeight: 1 }}>{user.name.split(' ')[0]}</p>
              <p style={{ fontSize: 11, color: '#B0B0B0', margin: '2px 0 0', lineHeight: 1 }}>{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            style={{ border: '1.5px solid #B0B0B0', background: 'none', padding: '9px 18px', borderRadius: 22, fontSize: 14, fontWeight: 500, cursor: 'pointer', color: '#222', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#222')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#B0B0B0')}
          >
            Log out
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onOpenLogin}
            style={{ border: '1.5px solid #B0B0B0', background: 'none', padding: '9px 18px', borderRadius: 22, fontSize: 14, fontWeight: 500, cursor: 'pointer', color: '#222', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#222')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#B0B0B0')}
          >
            Log in
          </button>
          <button
            onClick={onOpenRegister}
            style={{ background: '#222', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 22, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#333')}
            onMouseLeave={e => (e.currentTarget.style.background = '#222')}
          >
            Sign up — it's free
          </button>
        </div>
      )}
    </nav>
  );
}