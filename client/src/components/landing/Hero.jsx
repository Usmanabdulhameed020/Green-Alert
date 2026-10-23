import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, UserCheck, Send } from 'lucide-react';

export default function Hero() {
  return (
    <section id="home" className="relative min-h-[85vh] pt-36 pb-20 overflow-hidden bg-slate-50 flex flex-col items-center justify-center">
      {/* Background Gradients and Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-slate-50 to-slate-50 -z-10" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent -z-10" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center relative z-10">
        <div className="max-w-4xl mx-auto flex flex-col items-center">

          {/* Heading */}
          <h1
            aria-label="Report Environmental Issues Before They Become Disasters."
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6 mt-10"
          >
            <span className="block min-h-[1.15em]">
              Report Environmental Issues
            </span>
            <span className="block min-h-[1.15em] mt-1.5">
              Before They Become{' '}
              <span className="inline-block bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-500 bg-clip-text text-transparent drop-shadow-sm">
                Disasters.
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-500 font-normal leading-relaxed mb-8 max-w-2xl">
            GreenAlert empowers citizens to report environmental problems, monitor progress, and collaborate with organizations to create cleaner, safer, and more resilient communities.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full sm:w-auto">
            <a
              href="#how-it-works"
              className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/15 text-sm"
            >
              See How It Works
              <ArrowRight className="h-5 w-5" />
            </a>
            <Link
              to="/register-org"
              className="px-8 py-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold flex items-center justify-center gap-2 shadow-sm text-sm"
            >
              Explore Partners
            </Link>
          </div>

          {/* Conceptual Value Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl pt-4">
            {/* Pill 1 */}
            <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm text-left">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-0.5">3-Step Submissions</h4>
                <p className="text-[11px] text-slate-500 font-medium">Pin coordinates, snap photo, send.</p>
              </div>
            </div>

            {/* Pill 2 */}
            <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm text-left">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-0.5">Automated Triage</h4>
                <p className="text-[11px] text-slate-500 font-medium">Category matching & severity routing.</p>
              </div>
            </div>

            {/* Pill 3 */}
            <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-slate-200 bg-white shadow-sm text-left">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-0.5">Verified Agencies</h4>
                <p className="text-[11px] text-slate-500 font-medium">Direct routing to local municipal bodies.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
