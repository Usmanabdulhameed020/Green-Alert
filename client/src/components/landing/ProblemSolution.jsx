import { useState } from 'react';
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
        description: 'Toxins leaking into streams or illegal dumping in forest reserves often go unnoticed for months. Citizens lack a quick, centralized channel to submit reports, while city phone lines lead to administrative black holes.',
        points: [
          'No visual verification mechanism leads to vague logs',
          'Citizens are forced to research which state agency regulates which issue',
          'Reports are filed manually, taking weeks to get reviewed and dispatched',
        ],
      },
      solution: {
        headline: 'Instant GIS Dispatch & Automated Triage',
        description: 'GreenAlert enables citizens to submit verified photo evidence and precise coordinates in three taps. Our system uses spatial intelligence to immediately alert the closest response team.',
        points: [
          'Interactive GIS mapping automatically pinpoints ownership & agency jurisdiction',
          'Automated triage categorizes reports and assigns priority scores instantly',
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
        description: 'Municipal waste, hazardous chemical management, and local forestry departments operate on separate legacy software. This disconnected system slows down cross-department work.',
        points: [
          'Agencies cannot easily transfer multi-category incidents to one another',
          'NGOs and private contractors are left out of public safety notification loops',
          'No single source of truth exists for local environmental health logs',
        ],
      },
      solution: {
        headline: 'Unified Responder Platform',
        description: 'We bring municipalities, state agencies, waste management contractors, and environmental NGOs onto a single collaborative dashboard.',
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
        description: 'When citizens submit environmental complaints to local councils, they rarely receive status updates. This lack of transparency leads to civic frustration.',
        points: [
          'Complainants never know if their report was read, assigned, or ignored',
          'No public record exists of municipal environmental resolution times',
          'Citizens lose faith in the city\'s commitment to protect local reserves',
        ],
      },
      solution: {
        headline: 'Transparent Progress Tracking',
        description: 'GreenAlert closes the loop. Every report has a public timeline showing status changes (Submitted -> Under Review -> Assigned -> In Progress -> Resolved).',
        points: [
          'Real-time updates when status shifts',
          'Photo-verified resolution provides concrete proof of cleanup efforts',
          'Publicly audited resolution statistics foster trust and community pride',
        ],
      },
    },
  ];

  return (
    <section id="problem-solution" className="py-24 bg-white border-t border-slate-200 relative overflow-hidden">
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
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border flex items-center gap-2 ${
                activeTab === idx
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              {activeTab === idx ? tab.solutionIcon : tab.problemIcon}
              {tab.title}
            </button>
          ))}
        </div>

        {/* Content Box */}
        <div className="bg-slate-50/50 rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-lg relative min-h-[420px] text-left">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Left Column: Problem */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-rose-600 text-xs font-bold tracking-wider uppercase mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
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
          </div>
        </div>

      </div>
    </section>
  );
}
