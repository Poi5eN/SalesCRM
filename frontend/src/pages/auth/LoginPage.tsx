import { useAuth } from '@/hooks/useAuth.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';

const LoginPage = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: 'demo@dealmind.com', password: 'demo@123' });

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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[var(--content-bg)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Left: Content, Illustration & Branding */}
      <div className="hidden lg:flex flex-col justify-between p-16 bg-[var(--sidebar-bg)] border-r border-[var(--border)] relative overflow-hidden">
        <div className="relative flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center text-[var(--card-bg)] font-black text-sm shadow-sm">
            N
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight block leading-none">Nexus CRM</span>
            <span className="text-[10px] font-semibold text-[var(--text-muted)] tracking-widest uppercase">Productive Calm</span>
          </div>
        </div>

        <div className="relative my-auto py-12 flex flex-col items-center text-center">
          <div className="max-w-md space-y-6">
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-[var(--text-primary)]">
              The next generation of <span className="underline decoration-indigo-500 decoration-wavy">Sales Intelligence</span>.
            </h1>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              Close more deals, manage your pipeline with AI, and grow your business with a CRM designed for productive focus.
            </p>
          </div>
          <div className="w-80 h-80 mt-10">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_Uchf6_kvJzNlCrQKveF3AEf-wh1UxHU5Xu_PIZ2WpYmjYe1snqqMm-KNQfz0jv1cLUdy10sa3RIyNykjE_fGfWABL75Z-KwDJtB7NzMa2R1FjZglGhng0OkkP7aEXZDNR_8WKBVqzyC3UU3JboNzPQI9hL9aLcaAdLPtUyJRJh4g7QJ4ayOVgwhKIWtibT1Ms80lRrEokJ1EYDVmSqHIE9d-310b5bQsKvqa4gZjLMz6_rh7qz88CTwPfQ2qgWUMMh5mNXMHfNRh" 
              alt="Nexus CRM Productivity" 
              className="w-full h-full object-contain dark:opacity-80 dark:brightness-110" 
            />
          </div>
        </div>

        <div className="relative flex items-center space-x-6 text-[11px] text-[var(--text-muted)] font-semibold">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>© 2026 Nexus CRM Inc.</span>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex flex-col items-center justify-center p-8 md:p-12 lg:p-24 bg-[var(--content-bg)]">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">Welcome Back</h2>
            <p className="text-sm text-[var(--text-secondary)]">Please enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl flex items-center space-x-3 text-red-600 dark:text-red-400 text-sm animate-in fade-in zoom-in-95 duration-300">
                <ShieldCheck className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Email Address"
                placeholder="demo@dealmind.com"
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="bg-[var(--card-bg)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--text-primary)]"
              />
              <Input
                label="Password"
                placeholder="demo@123"
                type="password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="bg-[var(--card-bg)] border-[var(--border)] text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--text-primary)]"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-[var(--border)] text-[var(--text-primary)] bg-[var(--card-bg)] focus:ring-1 focus:ring-[var(--text-primary)]" />
                <span className="text-xs text-[var(--text-secondary)] font-medium">Remember me</span>
              </label>
              <a href="#" className="text-xs font-semibold text-[var(--text-primary)] hover:underline">
                Forgot password?
              </a>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3 bg-[var(--text-primary)] hover:opacity-90 active:scale-[0.98] text-[var(--card-bg)] font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-[var(--text-secondary)]">
            Don't have an account?{' '}
            <a href="#" className="font-semibold text-[var(--text-primary)] hover:underline">
              Start your 14-day free trial
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
