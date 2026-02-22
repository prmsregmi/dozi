import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { signInWithMagicLink, loading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await signInWithMagicLink(email);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-sm w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">Dozi</h1>
          <p className="text-slate-400 mt-2">AI-powered conversation intelligence</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          {submitted && !error ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
              <p className="text-slate-400 text-sm mb-1">
                We sent a magic link to
              </p>
              <p className="text-white font-medium text-sm mb-6">{email}</p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white mb-6 text-center">Sign in</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send magic link'}
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-slate-500">
                Password-free sign in via email
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
