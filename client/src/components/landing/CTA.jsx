import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import TreePlanterAnimation from './TreePlanterAnimation';

export default function CTA() {
  return (
    <section id="cta" className="py-24 bg-emerald-950 text-white relative overflow-hidden border-t border-emerald-900">
      {/* Background glowing gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/30 via-emerald-950 to-emerald-950 -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-8">
            <ShieldCheck className="h-4 w-4" />
            Join the Alliance
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            Together We Can Build <br />
            Cleaner Communities.
          </h2>

          {/* Subheading */}
          <p className="text-emerald-100/75 text-sm sm:text-base leading-relaxed mb-10 max-w-xl font-medium">
            Protect your neighborhood ecosystems. Join thousands of citizens and verified responding agencies logging and solving issues daily.
          </p>

          {/* Action Buttons — simple anchor links */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              to="/login"
              className="px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-emerald-950 font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-white/5 hover:translate-y-[-1px] active:translate-y-0 text-sm"
            >
              Start Reporting
              <ArrowRight className="h-4 w-4 text-emerald-900" />
            </Link>
            <Link
              to="/signup"
              className="px-8 py-3.5 rounded-xl bg-transparent border border-white/25 hover:border-white/50 text-white font-bold transition-all duration-200 text-sm text-center"
            >
              Join the Community
            </Link>
          </div>
        </motion.div>

        {/* Planting scene — the page ends on growth */}
        <div className="mt-14 w-60 sm:w-72 mx-auto" aria-hidden="true">
          <TreePlanterAnimation />
        </div>
      </div>
    </section>
  );
}
