import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Heart, Truck, CheckCircle2, ShieldCheck, ExternalLink } from 'lucide-react';

export default function Partners() {
  const organizations = [
    {
      id: 1,
      type: 'Government Agencies',
      title: 'State Waste Boards & Federal EPAs',
      description: 'Handles municipal waste management, environmental regulation enforcement, erosion controls, and public drainage maintenance.',
      partners: ['LAWMA (Lagos Waste)', 'NESREA (Federal Regulatory)', 'AEPB (Abuja Board)'],
      icon: <Building2 className="h-5 w-5 text-emerald-600" />,
      tag: 'Verified Gov Responders',
      bgColor: 'border-slate-200/80 bg-white',
    },
    {
      id: 2,
      type: 'Environmental NGOs',
      title: 'Community Conservation & Action Teams',
      description: 'Supports local conservation advocacy, Niger Delta cleanup initiatives, volunteer-led waste pick-ups, and ecosystem preservation.',
      partners: ['Nigerian Conservation Foundation', 'Lagos Green Coalition', 'Niger Delta Initiative'],
      icon: <Heart className="h-5 w-5 text-emerald-600" />,
      tag: 'NGO Responders',
      bgColor: 'border-slate-200/80 bg-white',
    },
    {
      id: 3,
      type: 'Waste Responders',
      title: 'Contracted Waste & Recycling Partners',
      description: 'Specialists in heavy industrial waste recycling, community-based plastic recovery, and neighborhood clearing operations.',
      partners: ['Wecyclers', 'RecyclePoints', 'Geocycle Nigeria'],
      icon: <Truck className="h-5 w-5 text-emerald-600" />,
      tag: 'Contracted Responders',
      bgColor: 'border-slate-200/80 bg-white',
    },
  ];

  return (
    <section id="partners" className="py-24 bg-slate-50 border-t border-slate-200 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#f0fdf4,transparent)] opacity-60 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
            Responder Network
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Verified Partner Organizations
          </h2>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-semibold">
            GreenAlert reports are instantly routed to authorized responders in your local jurisdiction. We work with public and private bodies to ensure safety.
          </p>
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {organizations.map((org, idx) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`p-6 rounded-2xl border bg-white hover:border-slate-300 transition-all duration-300 flex flex-col justify-between group shadow-md shadow-slate-100/50 ${org.bgColor}`}
            >
              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between mb-6">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                    {org.icon}
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-100 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    {org.tag}
                  </span>
                </div>

                {/* Title */}
                <span className="text-[10px] text-emerald-600 font-mono font-bold tracking-widest uppercase mb-1 block">
                  {org.type}
                </span>
                <h3 className="text-base font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors duration-250">
                  {org.title}
                </h3>
                
                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6 font-medium">
                  {org.description}
                </p>
              </div>

              {/* Verified Partners List */}
              <div className="border-t border-slate-100 pt-5 mt-auto">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Verified Local Partners
                </h4>
                <ul className="space-y-2 font-semibold">
                  {org.partners.map((partner, pIdx) => (
                    <li key={pIdx} className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{partner}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Informative bottom banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-12 p-6 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-md shadow-slate-100/50"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-emerald-600 font-bold font-mono shadow-sm">
              API
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-0.5">Are you a municipal or NGO dispatch manager?</h3>
              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed font-semibold">
                We integrate directly with local databases to sync incoming reports in real-time. Join our network to access coordinate telemetry.
              </p>
            </div>
          </div>
          <a 
            href="#cta"
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            Request Partner Access
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
