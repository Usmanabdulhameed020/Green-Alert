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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {statsData.map((stat) => (
            <div
              key={stat.id}
              className="relative p-6 rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden shadow-sm"
            >
              {/* Stat Icon */}
              <div className="mb-4 inline-flex items-center justify-center p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
                {stat.icon}
              </div>

              {/* Stat Value */}
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono mb-1 flex items-baseline">
                <span>{stat.value.toLocaleString()}</span>
                <span className="text-emerald-600 text-2xl font-bold ml-0.5">{stat.suffix}</span>
              </div>

              {/* Labels and Details */}
              <h4 className="text-sm font-bold text-slate-800 mb-1">{stat.label}</h4>
              <p className="text-xs text-slate-500 leading-normal font-medium">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
