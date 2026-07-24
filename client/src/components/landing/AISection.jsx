import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, CopyMinus, ShieldAlert, GitBranch, FileText } from 'lucide-react';

export default function AISection() {
  const features = [
    {
      id: 1,
      title: 'Automatic Categorization',
      description: 'Gemini Vision and NLP parse submitted photos and descriptions, accurately mapping the incident to categories like Toxic Waste or Tree Hazard in milliseconds.',
      icon: <Brain className="h-5 w-5 text-emerald-600" />,
    },
    {
      id: 2,
      title: 'Spatial Duplicate Detection',
      description: 'Scans nearby active reports within a 50m radius. If a duplicate incident is detected, the submission is linked to the existing case to prevent department clutter.',
      icon: <CopyMinus className="h-5 w-5 text-emerald-600" />,
    },
    {
      id: 3,
      title: 'Severity & Urgency Estimation',
      description: 'Calculates hazard ratings by checking for water proximity, road blockages, or hazardous labels, ensuring critical public safety cases are flagged first.',
      icon: <ShieldAlert className="h-5 w-5 text-emerald-600" />,
    },
    {
      id: 4,
      title: 'Smart Organization Recommendation',
      description: 'Matches the reporting category and GPS boundary coordinates to recommend the optimal verified responding government body or local NGO team.',
      icon: <GitBranch className="h-5 w-5 text-emerald-600" />,
    },
    {
      id: 5,
      title: 'Responder Bulletins',
      description: 'Synthesizes long citizen descriptions, user comment threads, and updates into a concise 3-sentence action plan for emergency response crews.',
      icon: <FileText className="h-5 w-5 text-emerald-600" />,
    },
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 },
    },
  };

  return (
    <section id="ai" className="py-24 bg-white relative overflow-hidden border-t border-slate-200">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Heading and Brand Details */}
          <div className="lg:col-span-5 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Gemini AI Integration
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
              AI-Powered Triage. <br />
              Zero Administrative <br />
              Bottlenecks.
            </h2>
            
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed mb-8 font-semibold">
              We leverage Gemini AI models to automate the triaging pipeline. Reports are instantly structured, prioritized, and matched, freeing municipal dispatchers to focus entirely on on-the-ground response.
            </p>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start gap-4">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 font-mono font-bold text-sm shadow-sm">
                AI
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Guaranteed Safety Checks</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  All automated AI triage classifications are audited by dispatch managers, ensuring system compliance and routing safety.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: AI Feature list grid (Col Span 7) */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {features.slice(0, 4).map((feat) => (
              <motion.div
                key={feat.id}
                variants={itemVariants}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white hover:shadow-md transition-all duration-300 text-left group flex flex-col justify-between"
              >
                <div>
                  <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform duration-300">
                    {feat.icon}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors duration-250">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    {feat.description}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Banner spanning both columns */}
            <motion.div
              variants={itemVariants}
              className="sm:col-span-2 p-5 rounded-2xl border border-emerald-100 bg-emerald-50/20 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    {features[4].title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-md font-semibold">
                    {features[4].description}
                  </p>
                </div>
              </div>
              <a 
                href="#partners"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-md transition-all self-start sm:self-center inline-flex items-center"
              >
                Learn AI Pipeline
              </a>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
