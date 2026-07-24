import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';
import logo from '../../assets/GreenAlert Logo.png';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Categories', href: '#categories' },
    { name: 'AI Features', href: '#ai' },
    { name: 'Partners', href: '#partners' },
  ];

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 border-b ${
        isScrolled
          ? 'bg-white/85 backdrop-blur-md border-slate-200/80 py-3 shadow-md shadow-slate-100/50'
          : 'bg-transparent border-transparent py-5'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2.5 group">
            <img src={logo} alt="GreenAlert logo" className="h-10 w-10 rounded-xl object-cover shadow-md shadow-emerald-500/10 group-hover:scale-105 transition-transform duration-200" />
            <div className="text-left">
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors duration-200">
                Green<span className="text-emerald-600">Alert</span>
              </span>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase -mt-0.5">
                Report & Protect
              </p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors duration-200 relative py-1 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-600 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-250"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors duration-205 px-4 py-2 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-500/20 transition-all duration-200 flex items-center gap-1.5 hover:translate-y-[-1px] active:translate-y-0 cursor-pointer"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-lg"
          >
            <div className="px-4 pt-4 pb-6 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-base font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl text-base font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all block"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-3 rounded-xl text-base font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-600/10 hover:bg-emerald-500 transition-all flex items-center justify-center gap-1.5"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
