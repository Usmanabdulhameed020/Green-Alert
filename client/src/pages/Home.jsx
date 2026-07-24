import React from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Stats from '../components/landing/Stats';
import HowItWorks from '../components/landing/HowItWorks';
import ProblemSolution from '../components/landing/ProblemSolution';
import Categories from '../components/landing/Categories';
import AISection from '../components/landing/AISection';
import Partners from '../components/landing/Partners';
import Testimonials from '../components/landing/Testimonials';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';
import SEO from '../components/SEO';
import { ScrollProgress, BackToTop } from '../components/landing/ScrollUI';

export default function Home() {
  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans antialiased selection:bg-emerald-600 selection:text-white overflow-x-hidden">
      <SEO />
      <ScrollProgress />
      
      <Navbar />

      <main>
        <Hero />
        <Stats />
        <HowItWorks />
        <ProblemSolution />
        <Categories />
        <AISection />
        <Partners />
        <Testimonials />
        <CTA />
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}
