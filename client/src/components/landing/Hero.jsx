import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldAlert, Sparkles, UserCheck, Send } from 'lucide-react';

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 15 },
    },
  };

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, delay: 0.6 }
    }
  };

  return (
    <section id="home" className="relative min-h-[85vh] pt-36 pb-20 overflow-hidden bg-slate-50 flex flex-col items-center justify-center">
      {/* Background Gradients and Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-slate-50 to-slate-50 -z-10" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent -z-10" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto flex flex-col items-center"
        >

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6 mt-10"
          >
            Report Environmental Issues <br className="hidden sm:inline" />
            Before They Become{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-500 bg-clip-text text-transparent drop-shadow-sm">
              Disasters.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg text-slate-500 font-normal leading-relaxed mb-8 max-w-2xl"
          >
            GreenAlert empowers citizens to report environmental problems, monitor progress, and collaborate with organizations to create cleaner, safer, and more resilient communities.
          </motion.p>

          {/* Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 mb-16 w-full sm:w-auto"
          >
            <a
              href="/signup"
              className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/15 hover:shadow-emerald-500/25 hover:translate-y-[-1px] active:translate-y-0 text-sm"
            >
              See How It Works
              <ArrowRight className="h-5 w-5" />
            </a>
            <Link
              to="/register-org"
              className="px-8 py-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm text-sm"
            >
              Explore Partners
            </Link>
          </motion.div>

          {/* Conceptual Value Pills instead of Demo Dashboard Mockup */}
          <motion.div
            variants={badgeVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl pt-4"
          >
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
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-0.5">Gemini AI Triage</h4>
                <p className="text-[11px] text-slate-500 font-medium">Auto-category matching & severity routing.</p>
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
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
