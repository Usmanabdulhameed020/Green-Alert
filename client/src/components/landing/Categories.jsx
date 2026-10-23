import { Trash2, Waves, Compass, Wind, HardHat, Droplet, AlertTriangle, Trees } from 'lucide-react';

export default function Categories() {
  const categories = [
    {
      id: 1,
      title: 'Illegal Dumping',
      description: 'Unauthorized disposal of toxic waste, rubble, tires, or heavy debris in public spaces.',
      reports: '18,432 reports',
      icon: <Trash2 className="h-6 w-6 text-emerald-600" />,
    },
    {
      id: 2,
      title: 'Flooding',
      description: 'Flash flooding, river overflows, or standing water blocking public walkways and lanes.',
      reports: '9,120 reports',
      icon: <Waves className="h-6 w-6 text-emerald-600" />,
    },
    {
      id: 3,
      title: 'Blocked Drainage',
      description: 'Clogged storm drains, leaf blockages, or trash dams preventing rainwater outflow.',
      reports: '12,504 reports',
      icon: <Compass className="h-6 w-6 text-emerald-600" />,
    },
    {
      id: 4,
      title: 'Air & Water Pollution',
      description: 'Industrial discharge, toxic chemical odors, or suspicious runoff in creeks and rivers.',
      reports: '7,890 reports',
      icon: <Wind className="h-6 w-6 text-emerald-600" />,
    },
    {
      id: 5,
      title: 'Overflowing Waste Bins',
      description: 'Overflowing public municipal trash receptacles causing health and environmental hazards.',
      reports: '14,291 reports',
      icon: <HardHat className="h-6 w-6 text-emerald-600" />,
    },
    {
      id: 6,
      title: 'Oil & Fuel Spills',
      description: 'Fuel leaks, oil slicks on pavement, or chemical spills threatening nearby sewers.',
      reports: '3,412 reports',
      icon: <Droplet className="h-6 w-6 text-emerald-600" />,
    },
    {
      id: 7,
      title: 'Road & Path Hazards',
      description: 'Open manholes, massive potholes, eroded trails, or collapsed sidewalk sections.',
      reports: '11,043 reports',
      icon: <AlertTriangle className="h-6 w-6 text-emerald-600" />,
    },
    {
      id: 8,
      title: 'Tree & Vegetation Hazards',
      description: 'Fallen limbs, blocked fire trails, uprooted trees, or power line clearance hazards.',
      reports: '6,785 reports',
      icon: <Trees className="h-6 w-6 text-emerald-600" />,
    },
  ];

  return (
    <section id="categories" className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16 mb-16">
          <div className="text-center lg:text-left max-w-2xl lg:max-w-xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Report Categories We Monitor
            </h2>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-semibold">
              Select from our standard reporting categories. Automated triage parses descriptions to match the appropriate municipal responder.
            </p>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Icon Wrapper */}
                <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-6">
                  {category.icon}
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-slate-900 mb-2">
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
