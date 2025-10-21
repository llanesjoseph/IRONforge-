import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '../lib/auth';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = isSignUp
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password);

      if (result.error) {
        setError(result.error);
      } else if (result.user) {
        navigate('/');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await signInWithGoogle();
      if (result.error) {
        setError(result.error);
      } else if (result.user) {
        navigate('/');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="card p-8">
          <div className="text-center mb-6">
            <img
              src="https://res.cloudinary.com/dr0jtjwlh/image/upload/v1761071813/ChatGPT_Image_Oct_21_2025_11_32_56_AM_o9ovtd.png"
              alt="GridAIron logo"
              className="mx-auto mb-6 w-72 max-w-full h-auto"
            />
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              Welcome to GridAIron
            </h1>
            <p className="text-iron-300">
              {isSignUp ? 'Create your account to get started' : 'Sign in to access your playbook'}
            </p>
          </div>
          {/* Google Sign-In (Primary) */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-[#3fe0ff] text-[#001318] font-bold hover:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:translate-y-[-1px]"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42v-.1H24v7h11.3C33.7 31.6 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5-5C33.2 5.4 28.8 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10.2 0 19-7.4 19-20 0-1.1-.1-2.1-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l5.7 4.2C13.6 15.4 18.4 12 24 12c3 0 5.8 1.1 7.9 3l5-5C33.2 5.4 28.8 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 10.1-2 13.7-5.3l-6.3-5.1C29.4 35.1 26.9 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-5.6 4.3C9.5 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42v-.1H24v7h11.3c-1 2.9-3.1 5.2-5.9 6.6l6.3 5.1C38.6 36.4 41 31.7 41 25c0-1.1-.1-2.1-.4-3.5z"/>
              </svg>
              {loading ? 'Loading...' : 'Sign in with Google'}
            </button>
            <p className="text-xs text-iron-400 mt-2 text-center">Use your school Google account</p>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-iron-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-gradient-to-br from-iron-800 to-iron-900 text-iron-400">Or use email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form className="space-y-4" onSubmit={handleEmailAuth}>
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-white mb-2">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-field w-full"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input-field w-full"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-iron-700 text-center">
            <p className="text-xs text-iron-400">© 2025 GridAIron · Early Access</p>
          </div>
        </div>
      </div>
    </div>
  );
}