import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function CTA() {
  return (
    <section id="cta" className="py-24 bg-emerald-950 text-white relative overflow-hidden border-t border-emerald-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-8">
            <ShieldCheck className="h-4 w-4" />
            Join the Alliance
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            Together We Can Build <br />
            Cleaner Communities.
          </h2>

          {/* Subheading */}
          <p className="text-emerald-100/75 text-sm sm:text-base leading-relaxed mb-10 max-w-xl font-medium">
            Protect your neighborhood ecosystems. Join thousands of citizens and verified responding agencies logging and solving issues daily.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              to="/login"
              className="px-8 py-3.5 rounded-xl bg-white text-emerald-950 font-bold flex items-center justify-center gap-2 shadow-lg text-sm"
            >
              Start Reporting
              <ArrowRight className="h-4 w-4 text-emerald-900" />
            </Link>
            <Link
              to="/signup"
              className="px-8 py-3.5 rounded-xl bg-transparent border border-white/25 text-white font-bold text-sm text-center"
            >
              Join the Community
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
