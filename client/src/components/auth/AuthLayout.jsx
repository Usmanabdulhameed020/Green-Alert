import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../SEO';

export default function AuthLayout({ title, subtitle, children, backTo = '/', showLogo = true, accent = 'emerald' }) {
  const isAmber = accent === 'amber';
  const gradientTo = isAmber ? 'to-amber-50' : 'to-emerald-50';
  const linkHover = isAmber ? 'hover:text-amber-600' : 'hover:text-emerald-600';

  return (
    <div className={`min-h-[100vh] bg-gradient-to-br from-slate-50 via-white ${gradientTo} flex items-center justify-center p-4`}>
      <SEO title={title} />
      <Link
        to={backTo}
        className={`absolute top-6 left-6 text-sm text-slate-400 ${linkHover} font-medium transition-colors z-10`}
      >
        &larr; Back to Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {showLogo && (
          <div className="text-center mb-8">
            <img
              src="/GreenAlert Logo.png"
              alt="GreenAlert"
              className="h-14 w-14 object-cover mx-auto mb-4"
            />
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
          </div>
        )}

        {!showLogo && (
          <div className="text-center mb-8">
            <img
              src="/GreenAlert Logo.png"
              alt="GreenAlert"
              className="h-12 w-12 object-cover mx-auto mb-3"
            />
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
