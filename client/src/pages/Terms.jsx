import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title="Terms of Service" />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link to="/" className="text-sm font-bold text-emerald-600 hover:text-emerald-500 mb-6 inline-block">← Back to Home</Link>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Terms of Service</h1>
        <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 text-sm text-slate-600 leading-relaxed">
          <p><strong>Effective Date:</strong> July 2026</p>
          <h2 className="text-lg font-bold text-slate-800">1. Acceptance of Terms</h2>
          <p>By accessing or using GreenAlert, you agree to be bound by these terms. If you do not agree, do not use the service.</p>
          <h2 className="text-lg font-bold text-slate-800">2. User Responsibilities</h2>
          <p>You agree to provide accurate information when submitting reports. You must not submit false, misleading, or malicious reports. You are responsible for maintaining the confidentiality of your account credentials.</p>
          <h2 className="text-lg font-bold text-slate-800">3. Acceptable Use</h2>
          <p>You agree not to use the platform for any unlawful purpose, to harass others, or to upload harmful content. We reserve the right to suspend accounts that violate these terms.</p>
          <h2 className="text-lg font-bold text-slate-800">4. Intellectual Property</h2>
          <p>The GreenAlert platform, logo, and brand are our intellectual property. Report data submitted by users remains the property of the submitter, with a license granted to GreenAlert to process and display it.</p>
          <h2 className="text-lg font-bold text-slate-800">5. Limitation of Liability</h2>
          <p>GreenAlert is provided "as is" without warranties. We are not liable for damages arising from use of the platform or actions taken based on report data.</p>
          <h2 className="text-lg font-bold text-slate-800">6. Changes</h2>
          <p>We reserve the right to modify these terms. Users will be notified of material changes via email or platform notification.</p>
        </div>
      </div>
    </div>
  );
}
