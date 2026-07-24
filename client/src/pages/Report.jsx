import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, MapPin, AlertTriangle } from 'lucide-react';
import logo from '../assets/GreenAlert Logo.png';

export default function Report() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('Illegal Dumping');
  const [priority, setPriority] = useState('Medium');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('greenalert_user');
    if (!savedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(savedUser));
    }
  }, [navigate]);

  const categories = [
    'Illegal Dumping',
    'Blocked Drainage',
    'Oil Spill',
    'Air Pollution',
    'Water Pollution',
    'Forest Fire',
    'Deforestation',
    'Noise Pollution'
  ];

  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          location,
          category,
          priority,
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?q=80&w=600&auto=format&fit=crop',
          latitude: 6.5244, // Default Lagos coords
          longitude: 3.3792
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit report');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/citizen-dashboard');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-50 via-slate-50 to-slate-50 -z-10" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="absolute top-0 left-0 w-full p-6">
        <Link to="/citizen-dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-600 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="GreenAlert logo" className="h-12 w-12 rounded-2xl object-cover shadow-md shadow-emerald-500/10" />
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Report Environmental Incident
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Provide accurate details to alert the local responding agencies
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white py-8 px-6 shadow-2xl rounded-3xl border border-slate-200/80 sm:px-10"
        >
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto text-3xl mb-4">
                ✓
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Report Submitted successfully</h3>
              <p className="text-sm text-slate-500">Routing details to verified local agency...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-semibold text-center flex items-center justify-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Incident Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Industrial chemical dumping in stream"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-sm rounded-xl px-4 py-3 text-slate-800 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Incident Description</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide precise details of the environmental hazard..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-sm rounded-xl px-4 py-3 text-slate-800 transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-sm rounded-xl px-4 py-3 text-slate-800 transition-all font-medium"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-sm rounded-xl px-4 py-3 text-slate-800 transition-all font-medium"
                  >
                    {priorities.map((pri) => (
                      <option key={pri} value={pri}>{pri} Priority</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Location Address</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Surulere, Lagos, Nigeria"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-sm rounded-xl pl-10 pr-4 py-3 text-slate-800 transition-all font-medium"
                  />
                  <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Evidence Image URL (Optional)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/evidence-image.jpg"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-sm rounded-xl px-4 py-3 text-slate-800 transition-all font-medium"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/15 text-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Green Alert
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
