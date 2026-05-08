import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../redux/authSlice';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    title: 'Smart Task Tracking',
    desc: 'Kanban boards and list views to keep every task visible.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Team Collaboration',
    desc: 'Assign tasks, track progress, and stay in sync.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    title: 'Insightful Reports',
    desc: 'Weekly summaries and workload analytics at a glance.',
  },
];

const Login = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState('EMPLOYEE');

  useEffect(() => {
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      dispatch(login({ email, password, userType }));
    }
  };

  const inputClass = 'w-full py-3 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-[14px] text-slate-800 placeholder-slate-400 outline-none transition-all hover:border-slate-300 hover:bg-white focus:border-[#5449D6] focus:bg-white focus:shadow-[0_0_0_3px_rgba(84,73,214,0.12)]';

  return (
    <div className="min-h-screen w-screen fixed inset-0 overflow-y-auto flex flex-col sm:flex-row bg-slate-50">

      {/* ── Left branded panel (desktop only) ─────────────────────────── */}
      <div className="hidden sm:flex sm:w-[46%] lg:w-[42%] relative flex-col overflow-hidden bg-gradient-to-br from-[#3B2FB1] via-[#5449D6] to-[#7C63F5]">

        {/* Decorative orbs */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/[0.06]" />
        <div className="absolute top-1/2 -left-16 w-52 h-52 rounded-full bg-white/[0.04]" />
        <div className="absolute -bottom-20 right-12 w-64 h-64 rounded-full bg-white/[0.05]" />
        {/* Dot grid pattern */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <div className="relative z-10 flex flex-col h-full px-10 lg:px-14 py-12">
          {/* Brand mark */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <span className="text-white font-bold text-[17px] tracking-tight">Trigital Tasks</span>
          </div>

          {/* Headline */}
          <div className="mt-auto mb-auto">
            <h2 className="text-white text-[34px] lg:text-[40px] font-bold leading-[1.2] tracking-tight mb-4">
              Everything your<br />team needs to<br />ship faster.
            </h2>
            <p className="text-white/60 text-[15px] leading-relaxed max-w-[320px]">
              Plan, track, and collaborate — all in one beautifully simple workspace.
            </p>

            {/* Feature list */}
            <div className="mt-10 flex flex-col gap-5">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-white/80">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-white text-[13px] font-semibold leading-tight">{f.title}</p>
                    <p className="text-white/50 text-[12px] leading-snug mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-8 border-t border-white/10">
            <p className="text-white/30 text-[12px]">© {new Date().getFullYear()} Trigital Technologies. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* ── Right / Mobile form panel ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white sm:bg-slate-50">

        {/* Mobile hero header */}
        <div className="sm:hidden relative overflow-hidden bg-gradient-to-br from-[#3B2FB1] via-[#5449D6] to-[#7C63F5] px-6 pt-14 pb-12 flex flex-col items-center text-center shrink-0">
          <div className="absolute inset-0 opacity-[0.08]" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <h1 className="text-white text-[24px] font-bold tracking-tight">Trigital Tasks</h1>
            <p className="text-white/60 text-[14px] mt-1">Your team's workspace</p>
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 sm:py-0">
          <div className="w-full max-w-[400px]">

            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-[26px] sm:text-[28px] font-bold text-slate-900 tracking-tight">Welcome back</h2>
              <p className="text-slate-500 text-[14px] mt-1">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-[13px] font-semibold text-slate-700 mb-1.5">Email address</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    autoFocus
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-[13px] font-semibold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* User type */}
              <div>
                <label htmlFor="userType" className="block text-[13px] font-semibold text-slate-700 mb-1.5">Account type</label>
                <Select value={userType} onValueChange={setUserType}>
                  <SelectTrigger id="userType" className="w-full h-[46px] rounded-xl border-slate-200 bg-slate-50 text-[14px] text-slate-700 hover:bg-white hover:border-slate-300 focus:border-[#5449D6] focus:shadow-[0_0_0_3px_rgba(84,73,214,0.12)] transition-all">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-[13px]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 py-3.5 rounded-xl bg-[#5449D6] text-white text-[15px] font-semibold flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(84,73,214,0.35)] hover:enabled:bg-[#4740c4] hover:enabled:shadow-[0_6px_20px_rgba(84,73,214,0.45)] hover:enabled:-translate-y-px active:enabled:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>

            </form>

            {/* Footer */}
            <p className="text-center text-[12px] text-slate-400 mt-8">
              © {new Date().getFullYear()} Trigital Technologies
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;
