import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldX, ShieldCheck, EyeOff, Radio, Users, Zap } from 'lucide-react';

export default function ProblemSolution() {
  const [activeTab, setActiveTab] = useState(0);

  const challenges = [
    {
      title: 'Silent Incidents & Bureaucracy',
      problemIcon: <EyeOff className="h-5 w-5 text-rose-500" />,
      solutionIcon: <Radio className="h-5 w-5 text-emerald-600" />,
      problem: {
        headline: 'Hazards Go Unreported and Unaddressed',
        description: 'Toxins leaking into streams or illegal dumping in forest reserves often go unnoticed for months. Citizens lack a quick, centralized channel to submit reports, while city phone lines and legacy email portals lead to administrative black holes.',
        points: [
          'No visual verification mechanism leads to spam or vague logs',
          'Citizens are forced to research which state agency regulates which issue',
          'Reports are filed manually, taking weeks to get reviewed and dispatched',
        ],
      },
      solution: {
        headline: 'Instant GIS Dispatch & AI Triage',
        description: 'GreenAlert enables citizens to submit verified photo evidence and precise coordinates in three taps. Our system uses spatial intelligence to immediately alert the closest response team, converting a weeks-long process into minutes.',
        points: [
          'Interactive GIS mapping automatically pinpoints ownership & agency jurisdiction',
          'Gemini AI categorizes reports and assigns priority scores instantly',
          'Verified telemetry ensures that responders have exact data before arriving',
        ],
      },
    },
    {
      title: 'Response Disconnection',
      problemIcon: <ShieldX className="h-5 w-5 text-rose-500" />,
      solutionIcon: <ShieldCheck className="h-5 w-5 text-emerald-600" />,
      problem: {
        headline: 'Departments Working in Silos',
        description: 'Municipal waste, hazardous chemical management, and local forestry departments operate on separate legacy software. This disconnected system slows down cross-department work, leaving critical hazards unassigned.',
        points: [
          'Agencies cannot easily transfer multi-category incidents to one another',
          'NGOs and private contractors are left out of public safety notification loops',
          'No single source of truth exists for local environmental health logs',
        ],
      },
      solution: {
        headline: 'Unified Responder Platform',
        description: 'We bring municipalities, state agencies, waste management contractors, and environmental NGOs onto a single collaborative dashboard. Incidents can be triaged, shared, and co-managed with full visibility.',
        points: [
          'One dashboard for all verified public and private organizations',
          'Secure API routing ensures reports flow directly into agency work-queues',
          'Collaborative triage allows multi-agency handoffs at the click of a button',
        ],
      },
    },
    {
      title: 'The Accountability Void',
      problemIcon: <Users className="h-5 w-5 text-rose-500" />,
      solutionIcon: <Zap className="h-5 w-5 text-emerald-600" />,
      problem: {
        headline: 'Feedback Loop is Broken',
        description: 'When citizens submit environmental complaints to local councils, they rarely receive status updates. This lack of transparency leads to civic frustration, community fatigue, and a decline in report submissions.',
        points: [
          'Complainants never know if their report was read, assigned, or ignored',
          'No public record exists of municipal environmental resolution times',
          'Citizens lose faith in the city\'s commitment to protect local reserves',
        ],
      },
      solution: {
        headline: 'Transparent Progress Tracking',
        description: 'GreenAlert closes the loop. Every report has a public timeline showing status changes (Submitted -> Under Review -> Assigned -> In Progress -> Resolved). Responders upload completion photos to verify resolution.',
        points: [
          'Real-time notifications sent to citizens when status shifts',
          'Photo-verified resolution provides concrete proof of cleanup efforts',
          'Publicly audited resolution statistics foster trust and community pride',
        ],
      },
    },
  ];

  return (
    <section id="problem-solution" className="py-24 bg-white border-t border-slate-200 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#f0fdf4,transparent)] opacity-60 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Solving the Environmental Response Crisis
          </h2>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-semibold">
            Legacy systems fail to protect our environment. Here is how GreenAlert connects citizens and responders to solve challenges efficiently.
          </p>
        </div>

        {/* Tab Headers */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-12">
          {challenges.map((tab, idx) => (
            <button
              key={tab.title}
              onClick={() => setActiveTab(idx)}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 border flex items-center gap-2 ${
                activeTab === idx
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {activeTab === idx ? tab.solutionIcon : tab.problemIcon}
              {tab.title}
            </button>
          ))}
        </div>

        {/* Content Box */}
        <div className="bg-slate-50/50 rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-lg overflow-hidden relative min-h-[420px] text-left">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16"
            >
              {/* Left Column: Problem */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 text-rose-600 text-xs font-bold tracking-wider uppercase mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    The Challenge
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-4">
                    {challenges[activeTab].problem.headline}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium">
                    {challenges[activeTab].problem.description}
                  </p>
                </div>
                
                <ul className="space-y-3.5 border-t border-slate-200 pt-6">
                  {challenges[activeTab].problem.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-400 font-medium">
                      <span className="text-rose-500 font-bold mt-0.5">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Column: Solution */}
              <div className="flex flex-col justify-between p-6 sm:p-8 rounded-2xl border border-emerald-100 bg-emerald-50/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                
                <div>
                  <div className="inline-flex items-center gap-2 text-emerald-700 text-xs font-bold tracking-wider uppercase mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Our Solution
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-4">
                    {challenges[activeTab].solution.headline}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                    {challenges[activeTab].solution.description}
                  </p>
                </div>

                <ul className="space-y-3.5 border-t border-emerald-100 pt-6 font-medium">
                  {challenges[activeTab].solution.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                      <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
