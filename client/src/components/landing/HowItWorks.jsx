import { Camera, FileSearch, ArrowRightLeft, ShieldCheck } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Report Incident',
      description: 'Capture photos, write a description, and select the location. Automatic triage helps with categorizing and estimating urgency.',
      icon: <Camera className="h-6 w-6 text-emerald-600" />,
      color: 'border-slate-200/80 shadow-slate-100/50',
      badge: 'Citizen Action',
    },
    {
      number: '02',
      title: 'Automated Verification',
      description: 'System scans for duplicates and estimates severity. Responders review submissions to filter out false alarms.',
      icon: <FileSearch className="h-6 w-6 text-emerald-600" />,
      color: 'border-slate-200/80 shadow-slate-100/50',
      badge: 'Verification',
    },
    {
      number: '03',
      title: 'Routed Assignment',
      description: 'The report is automatically routed and assigned to verified municipalities, local NGOs, or waste responders.',
      icon: <ArrowRightLeft className="h-6 w-6 text-emerald-600" />,
      color: 'border-slate-200/80 shadow-slate-100/50',
      badge: 'Routing',
    },
    {
      number: '04',
      title: 'Action & Resolution',
      description: 'Teams are dispatched to resolve the issue. Citizens track real-time progress photo updates.',
      icon: <ShieldCheck className="h-6 w-6 text-emerald-600" />,
      color: 'border-slate-200/80 shadow-slate-100/50',
      badge: 'Outcome',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            How GreenAlert Works
          </h2>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-semibold">
            From the initial citizen snap to the final cleanup, we automate routing to make environmental action transparent and rapid.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-[44px] left-[12.5%] right-[12.5%] h-[1px] bg-gradient-to-r from-emerald-500/10 via-slate-200 to-emerald-500/10 -z-10" />

          {steps.map((step) => (
            <div
              key={step.number}
              className={`p-6 rounded-2xl border bg-white shadow-md shadow-slate-100/50 relative ${step.color}`}
            >
              {/* Card Badge */}
              <div className="absolute -top-3 right-4 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                {step.badge}
              </div>

              {/* Header Step Indicator */}
              <div className="flex items-center justify-between mb-6">
                <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  {step.icon}
                </div>
                <span className="text-3xl font-extrabold font-mono text-slate-200 tracking-tighter">
                  {step.number}
                </span>
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {step.title}
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-medium">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
