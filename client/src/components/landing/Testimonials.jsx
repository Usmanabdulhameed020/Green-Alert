import React from 'react';
import { motion } from 'framer-motion';
import { Quote, ShieldCheck } from 'lucide-react';

export default function Testimonials() {
  const testimonials = [
    {
      id: 1,
      quote: "I reported a massive heap of plastic waste blocking the canal behind our street in Gbagada, Lagos. Within hours, I got a notification that LAWMA was dispatched. By evening, the drainage was cleared and flowing. The level of transparency is unlike anything I've seen in civic apps.",
      author: "Amina Bello",
      role: "Gbagada Resident, Lagos",
      verified: true,
      avatarInitials: "AB",
    },
    {
      id: 2,
      quote: "As a community lead in Enugu, I used to call government offices for days about blocked culverts causing road erosion. With GreenAlert, I just pin the exact coordinates and upload photo proof. The Enugu State Waste Management Authority (ESWAMA) acts much faster because the details are structured.",
      author: "Chidi Okafor",
      role: "Community Coalition Coordinator",
      verified: true,
      avatarInitials: "CO",
    },
    {
      id: 3,
      quote: "Our NGO monitors water safety and oil runoffs in the Niger Delta. GreenAlert's AI categorization has been excellent. It routes spill reports directly to our dashboard. We coordinate with NOSDRA in real-time, preventing incidents from turning into massive ecological disasters.",
      author: "Engr. Olumide Adebayo",
      role: "Niger Delta Conservation Group",
      verified: true,
      avatarInitials: "OA",
    },
  ];

  return (
    <section id="testimonials" className="py-24 bg-white relative overflow-hidden border-t border-slate-200">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        <div className="max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
            Testimonials
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
            Voice of the Community
          </h2>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-semibold">
            Read how citizens and organizations use GreenAlert to restore, report, and preserve their local ecosystems.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {testimonials.map((test, idx) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-slate-50/50 backdrop-blur-sm flex flex-col justify-between text-left hover:border-slate-300 transition-all duration-300 relative group shadow-sm hover:shadow-md"
            >
              {/* Quote Mark Icon */}
              <Quote className="absolute top-6 right-6 h-8 w-8 text-slate-200 group-hover:text-emerald-500/10 transition-colors duration-300 pointer-events-none" />

              <blockquote className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 font-semibold">
                "{test.quote}"
              </blockquote>

              {/* Author Info */}
              <div className="flex items-center gap-3.5 border-t border-slate-200 pt-5">
                {/* Avatar */}
                <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 text-xs font-bold font-mono shadow-sm shrink-0">
                  {test.avatarInitials}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="text-sm text-slate-900 leading-tight">{test.author}</span>
                    {test.verified && (
                      <span className="text-emerald-500" title="Verified User">
                        <ShieldCheck className="h-4 w-4 fill-emerald-500/10" />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-bold block mt-0.5">{test.role}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
