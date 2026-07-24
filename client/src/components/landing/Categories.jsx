import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, Waves, Compass, Wind, HardHat, Droplet, AlertTriangle, Trees } from 'lucide-react';

export default function Categories() {
  const categories = [
    {
      id: 1,
      title: 'Illegal Dumping',
      description: 'Unauthorized disposal of toxic waste, rubble, tires, or heavy debris in public spaces.',
      reports: '18,432 reports',
      icon: <Trash2 className="h-6 w-6 text-emerald-600" />,
      gradient: 'from-emerald-500/5 to-transparent',
    },
    {
      id: 2,
      title: 'Flooding',
      description: 'Flash flooding, river overflows, or standing water blocking public walkways and lanes.',
      reports: '9,120 reports',
      icon: <Waves className="h-6 w-6 text-emerald-600" />,
      gradient: 'from-emerald-500/5 to-transparent',
    },
    {
      id: 3,
      title: 'Blocked Drainage',
      description: 'Clogged storm drains, leaf blockages, or trash dams preventing rainwater outflow.',
      reports: '12,504 reports',
      icon: <Compass className="h-6 w-6 text-emerald-600" />,
      gradient: 'from-emerald-500/5 to-transparent',
    },
    {
      id: 4,
      title: 'Air & Water Pollution',
      description: 'Industrial discharge, toxic chemical odors, or suspicious runoff in creeks and rivers.',
      reports: '7,890 reports',
      icon: <Wind className="h-6 w-6 text-emerald-600" />,
      gradient: 'from-emerald-500/5 to-transparent',
    },
    {
      id: 5,
      title: 'Overflowing Waste Bins',
      description: 'Overflowing public municipal trash receptacles causing health and environmental hazards.',
      reports: '14,291 reports',
      icon: <HardHat className="h-6 w-6 text-emerald-600" />,
      gradient: 'from-emerald-500/5 to-transparent',
    },
    {
      id: 6,
      title: 'Oil & Fuel Spills',
      description: 'Fuel leaks, oil slicks on pavement, or chemical spills threatening nearby sewers.',
      reports: '3,412 reports',
      icon: <Droplet className="h-6 w-6 text-emerald-600" />,
      gradient: 'from-emerald-500/5 to-transparent',
    },
    {
      id: 7,
      title: 'Road & Path Hazards',
      description: 'Open manholes, massive potholes, eroded trails, or collapsed sidewalk sections.',
      reports: '11,043 reports',
      icon: <AlertTriangle className="h-6 w-6 text-emerald-600" />,
      gradient: 'from-emerald-500/5 to-transparent',
    },
    {
      id: 8,
      title: 'Tree & Vegetation Hazards',
      description: 'Fallen limbs, blocked fire trails, uprooted trees, or power line clearance hazards.',
      reports: '6,785 reports',
      icon: <Trees className="h-6 w-6 text-emerald-600" />,
      gradient: 'from-emerald-500/5 to-transparent',
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 15 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 },
    },
  };

  return (
    <section id="categories" className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Report Categories We Monitor
          </h2>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-semibold">
            Select from our standard reporting categories. Gemini AI automatically parses descriptions to match the appropriate municipal responder.
          </p>
        </div>

        {/* Categories Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {categories.map((category) => (
            <motion.div
              key={category.id}
              variants={itemVariants}
              className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-md shadow-slate-100/30 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden"
            >
              {/* Corner Gradient Glow */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${category.gradient} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

              <div>
                {/* Icon Wrapper */}
                <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-6 shadow-sm group-hover:scale-105 group-hover:border-slate-300 transition-all duration-300">
                  {category.icon}
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors duration-250">
                  {category.title}
                </h3>
                
                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6 font-medium">
                  {category.description}
                </p>
              </div>

              {/* Footer Stat info */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                <span className="text-[11px] font-bold text-slate-400 font-mono">
                  {category.reports}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 flex items-center gap-0.5">
                  Report Now &rarr;
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
