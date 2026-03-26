import { LogOut, Home, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onGoHome: () => void;
  onGoEstimate: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export default function Navbar({ onGoHome, onGoEstimate, onOpenLogin, onOpenRegister }: NavbarProps) {
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/95 backdrop-blur-md border-b border-gray-200 flex items-center px-6 justify-between shadow-sm">
      {/* Logo */}
      <button onClick={onGoHome} className="flex items-center gap-1 group">
        <span className="text-2xl font-black text-red-600 group-hover:text-red-700 transition-colors">Stay</span>
        <span className="text-2xl font-black text-gray-900">Worth</span>
      </button>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-6">
        <button
          onClick={onGoHome}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Home size={16} /> Home
        </button>
        <button
          onClick={onGoEstimate}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          <BarChart2 size={16} /> Estimate
        </button>
      </div>

      {/* Auth area */}
      {user ? (
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
              {user.name[0].toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 leading-none">{user.name.split(' ')[0]}</p>
              <p className="text-xs text-gray-500 leading-none mt-0.5">{user.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenLogin}
            className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 transition-all"
          >
            Log in
          </button>
          <button
            onClick={onOpenRegister}
            className="px-5 py-2 text-sm font-semibold text-white bg-black rounded-full hover:bg-gray-800 transition-all"
          >
            Sign up free
          </button>
        </div>
      )}
    </nav>
  );
}
