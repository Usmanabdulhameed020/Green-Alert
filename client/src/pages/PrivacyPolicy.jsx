import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SEO title="Privacy Policy" />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link to="/" className="text-sm font-bold text-emerald-600 hover:text-emerald-500 mb-6 inline-block">← Back to Home</Link>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Privacy Policy</h1>
        <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 text-sm text-slate-600 leading-relaxed">
          <p><strong>Effective Date:</strong> July 2026</p>
          <h2 className="text-lg font-bold text-slate-800">1. Information We Collect</h2>
          <p>We collect information you provide when creating an account, submitting reports, and using our platform. This includes your name, email address, location data, uploaded images, and report descriptions.</p>
          <h2 className="text-lg font-bold text-slate-800">2. How We Use Your Information</h2>
          <p>Your information is used to facilitate environmental reporting, assign reports to agencies, track resolution progress, and communicate updates. Location data is used to map incidents accurately.</p>
          <h2 className="text-lg font-bold text-slate-800">3. Data Sharing</h2>
          <p>We share report data with designated government agencies and environmental organizations for resolution purposes. We do not sell your personal data to third parties.</p>
          <h2 className="text-lg font-bold text-slate-800">4. Cookies</h2>
          <p>We use essential cookies for authentication and session management. Analytics cookies may be used to improve our service. You can control cookie preferences through your browser settings.</p>
          <h2 className="text-lg font-bold text-slate-800">5. Data Retention</h2>
          <p>We retain your account information and reports for as long as your account is active. You may request deletion of your account and associated data at any time.</p>
          <h2 className="text-lg font-bold text-slate-800">6. Contact</h2>
          <p>For privacy inquiries, contact us at privacy@greenalert.com</p>
        </div>
      </div>
    </div>
  );
}
