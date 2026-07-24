import React from 'react';
import { Globe, Terminal, MessageSquare, Mail, ArrowRight } from 'lucide-react';
import logo from '../../assets/GreenAlert Logo.png';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Features', href: '#how-it-works' },
      { name: 'GIS Live Map', href: '#map' },
      { name: 'AI Triage Engine', href: '#ai' },
      { name: 'API Access', href: '#partners' },
    ],
    resources: [
      { name: 'Documentation', href: '#ai' },
      { name: 'Community Guides', href: '#reports' },
      { name: 'System Status', href: '#map' },
      { name: 'Help Center', href: '#cta' },
    ],
    organization: [
      { name: 'Partnerships', href: '#partners' },
      { name: 'Agency Signup', href: '#cta' },
      { name: 'Press Kit', href: '#home' },
      { name: 'Contact Sales', href: '#cta' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '#home' },
      { name: 'Terms of Service', href: '#home' },
      { name: 'Cookie Settings', href: '#home' },
      { name: 'SLA Terms', href: '#home' },
    ],
  };

  return (
    <footer className="bg-white border-t border-slate-200 text-left pt-20 pb-10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top: Branding and Newsletter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 border-b border-slate-200">
          
          {/* Logo & Pitch */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <a href="#home" className="flex items-center gap-2.5 mb-6 group">
              <img src={logo} alt="GreenAlert logo" className="h-10 w-10 rounded-xl object-cover shadow-md shadow-emerald-500/10 group-hover:scale-105 transition-transform duration-200" />
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors duration-200">
                  Green<span className="text-emerald-600">Alert</span>
                </span>
                <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase -mt-0.5">
                  Report & Protect
                </p>
              </div>
            </a>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-sm font-semibold">
              Empowering citizens to report environmental problems in their communities. Route reports directly to verified organizations for rapid action.
            </p>
          </div>

          {/* Newsletter Box */}
          <div className="lg:col-span-7 flex flex-col items-start lg:items-end w-full">
            <div className="w-full max-w-md">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Subscribe to Action Alerts</h3>
              <p className="text-xs text-slate-500 mb-4 font-semibold">
                Receive weekly digests of resolved reports, community cleanups, and local environmental bulletins.
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 w-full">
                <div className="relative flex-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-xs rounded-xl pl-10 pr-4 py-2.5 text-slate-800 placeholder-slate-400 shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shrink-0"
                >
                  Join
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* Middle: Links Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-16">
          <div>
            <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-4">Product</h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-slate-500 hover:text-slate-900 transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-4">Resources</h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-slate-500 hover:text-slate-900 transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-4">Organization</h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              {footerLinks.organization.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-slate-500 hover:text-slate-900 transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-4">Legal</h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a href={link.href} className="text-slate-500 hover:text-slate-900 transition-colors">
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom: Socials and Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-200 pt-10">
          <span className="text-[11px] text-slate-400 font-bold">
            &copy; {currentYear} GreenAlert. All rights reserved. "Report Today. Protect Tomorrow."
          </span>

          <div className="flex items-center gap-4">
            <a href="#home" className="h-9 w-9 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-900 flex items-center justify-center transition-colors shadow-sm">
              <Globe className="h-4 w-4" />
            </a>
            <a href="#home" className="h-9 w-9 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-900 flex items-center justify-center transition-colors shadow-sm">
              <Terminal className="h-4 w-4" />
            </a>
            <a href="#home" className="h-9 w-9 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-900 flex items-center justify-center transition-colors shadow-sm">
              <MessageSquare className="h-4 w-4" />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
