import React from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, ShieldCheck, Landmark, Users } from 'lucide-react';

export default function Stats() {
  const statsData = [
    {
      id: 1,
      value: 50000,
      suffix: '+',
      label: 'Reports Submitted',
      description: 'Logged and routed environmental issues.',
      icon: <FileSpreadsheet className="h-6 w-6 text-emerald-600" />,
    },
    {
      id: 2,
      value: 95,
      suffix: '%',
      label: 'Resolution Rate',
      description: 'Successfully verified and resolved cases.',
      icon: <ShieldCheck className="h-6 w-6 text-emerald-600" />,
    },
    {
      id: 3,
      value: 120,
      suffix: '+',
      label: 'Communities Served',
      description: 'Active municipal districts and cities.',
      icon: <Users className="h-6 w-6 text-emerald-600" />,
    },
    {
      id: 4,
      value: 35,
      suffix: '',
      label: 'Partner Organizations',
      description: 'Verified government & NGO responders.',
      icon: <Landmark className="h-6 w-6 text-emerald-600" />,
    },
  ];

  return (
    <section className="bg-white border-y border-slate-200 py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#f0fdf4,transparent)] opacity-60 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {statsData.map((stat, idx) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="relative p-6 rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden group hover:border-slate-300 hover:bg-slate-55 transition-all duration-300 shadow-sm"
            >
              {/* Subtle top light bar */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Stat Icon */}
              <div className="mb-4 inline-flex items-center justify-center p-3 rounded-xl bg-white border border-slate-200 shadow-sm group-hover:scale-105 transition-transform duration-300">
                {stat.icon}
              </div>

              {/* Stat Value Counter */}
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono mb-1 flex items-baseline">
                <span>{stat.value.toLocaleString()}</span>
                <span className="text-emerald-600 text-2xl font-bold ml-0.5">{stat.suffix}</span>
              </div>

              {/* Labels and Details */}
              <h4 className="text-sm font-bold text-slate-800 mb-1">{stat.label}</h4>
              <p className="text-xs text-slate-500 leading-normal font-medium">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
