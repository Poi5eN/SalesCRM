import { useAuth } from '@/hooks/useAuth.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';

const LoginPage = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(form);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Left: Content & Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000')] opacity-10 bg-cover bg-center" />

        <div className="relative flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
            G
          </div>
          <span className="text-2xl font-bold tracking-tight">PSG</span>
        </div>

        <div className="relative space-y-6 max-w-md">
          <h1 className="text-5xl font-bold leading-tight">
            The next generation of <span className="text-indigo-400">Sales Intelligence</span>.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Close more deals, manage your pipeline with AI, and grow your business with a CRM that works for you.
          </p>
          <div className="flex items-center space-x-4 pt-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-slate-900 bg-slate-800" />
              ))}
            </div>
            <span className="text-sm text-slate-400 font-medium">Joined by 2,000+ top performing sales teams</span>
          </div>
        </div>

        <div className="relative flex items-center space-x-6 text-sm text-slate-500 font-medium">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>© 2026 PSG Inc.</span>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex flex-col items-center justify-center p-8 md:p-12 lg:p-24 bg-slate-50">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-3xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-slate-500">Please enter your details to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 text-red-700 text-sm animate-in fade-in zoom-in-95 duration-300">
                <ShieldCheck className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Email Address"
                placeholder="you@company.com"
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
              <Input
                label="Password"
                placeholder="••••••••"
                type="password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                <span className="text-sm text-slate-600 font-medium">Remember me</span>
              </label>
              <a href="#" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                Forgot password?
              </a>
            </div>

            <Button type="submit" className="w-full py-6 text-lg shadow-lg shadow-indigo-600/20" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Start your 14-day free trial
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
