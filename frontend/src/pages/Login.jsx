import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useBusiness } from '../context/BusinessContext.jsx';
import { apiRequest } from '../services/api.js';
import { applyTheme } from '../theme/tokens.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const { business } = useBusiness();
  const navigate = useNavigate();

  useEffect(() => {
    if (business) {
      applyTheme(business.type === 'KRISHI' ? 'krishi' : 'hardware');
    } else {
      applyTheme('neutral');
    }
  }, [business]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      login(data);
      navigate('/select-business');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background Gradient Decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-container rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-secondary-container rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-tertiary-container rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Login Card */}
      <main className="w-full max-w-[420px] bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-outline-variant/30 p-8 z-10 relative">
        {/* Header / Branding */}
        <div className="flex flex-col items-center mb-8">
          <Logo variant="login" className="mb-4" />
          <h1 className="font-headline text-2xl font-bold text-on-surface text-center tracking-tight mb-1">
            Gohite Management
          </h1>
          <p className="font-body text-on-surface-variant text-sm text-center">
            Sign in to your enterprise suite
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-1.5 text-left">
            <label className="block font-label text-sm font-medium text-on-surface" htmlFor="email">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline-variant text-[20px]">mail</span>
              </div>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="admin@gohite.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-surface text-on-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors outline-none"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <label className="block font-label text-sm font-medium text-on-surface" htmlFor="password">
                Password
              </label>
              <a className="font-label text-sm font-medium text-primary hover:opacity-80 transition-colors" href="#">
                Forgot Password?
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-outline-variant text-[20px]">lock</span>
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 bg-surface text-on-surface border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-colors outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-outline-variant rounded bg-surface"
            />
            <label className="ml-2 block text-sm text-on-surface-variant font-body cursor-pointer select-none" htmlFor="remember-me">
              Remember me for 30 days
            </label>
          </div>

          {error && <p className="text-sm text-error text-center">{error}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm font-label text-sm font-medium text-on-primary bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>



        {/* Footer */}
        <div className="mt-8 text-center border-t border-outline-variant/30 pt-6">
          <p className="text-xs text-on-surface-variant font-body">
            Secure enterprise login powered by Gohite Systems. <br />
            <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a> ·{' '}
            <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
          </p>
        </div>
      </main>
    </div>
  );
}

