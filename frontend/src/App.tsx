import { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Estimate from './pages/Estimate';
import Dashboard from './pages/Dashboard';
import Contact from './pages/Contact';
import AuthModal from './components/AuthModal';
import { useAuth } from './context/AuthContext';

type Page = 'home' | 'estimate' | 'dashboard' | 'contact';

export default function App() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>('home');
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#fff', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ 
          width: 36, 
          height: 36, 
          border: '3px solid #EBEBEB', 
          borderTopColor: '#FF385C', 
          borderRadius: '50%', 
          animation: 'spin 0.7s linear infinite' 
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const handleGetEstimate = () => {
    if (user) setPage('estimate');
    else setAuthModal('register');
  };

  const handleGoDashboard = () => {
    if (user) setPage('dashboard');
    else setAuthModal('login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <Navbar
        onGoHome={() => setPage('home')}
        onGoEstimate={handleGetEstimate}
        onGoDashboard={handleGoDashboard}
        onGoContact={() => setPage('contact')}
        onOpenLogin={() => setAuthModal('login')}
        onOpenRegister={() => setAuthModal('register')}
        activePage={page}
      />

      {page === 'home' && <Home onGetEstimate={handleGetEstimate} />}
      {page === 'estimate' && <Estimate />}
      {page === 'dashboard' && <Dashboard onGoEstimate={() => setPage('estimate')} />}
      {page === 'contact' && <Contact />}

      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
          onSwitch={(m) => setAuthModal(m)}
          onSuccess={() => {
            setAuthModal(null);
            setPage('estimate');
          }}
        />
      )}
    </div>
  );
}