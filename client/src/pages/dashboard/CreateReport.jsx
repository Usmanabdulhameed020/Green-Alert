import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MapLibreMap from '../../components/map/MapLibreMap';
import {
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Upload,
  CheckCircle,
  MapPin,
  AlertTriangle,
  Flame,
  Droplet,
  Trash2,
  Trees,
  Info,
  Maximize2
} from 'lucide-react';
import SEO from '../../components/SEO';
import { useCitizen } from '../../contexts/CitizenContext';
import AlertModal from '../../components/ui/AlertModal';
import LeafBurst from '../../components/ui/LeafBurst';
import axios from 'axios';

const steps = [
  'Category',
  'Location',
  'Images',
  'Description',
  'Severity',
  'Preview',
  'Submit',
];

const categoryConfig = [
  { name: 'Illegal Dumping', desc: 'Waste heap, plastics dumping, batteries', icon: Trash2 },
  { name: 'Blocked Drainage', desc: 'Silt, plastics clogging canals and gutters', icon: Info },
  { name: 'Oil Spill', desc: 'Industrial runtime petroleum or oil slick', icon: Droplet },
  { name: 'Air Pollution', desc: 'Heavy smoke, gas leakage, dust clouding', icon: Flame },
  { name: 'Water Pollution', desc: 'Sewage runoffs, coloring stream wastes', icon: Droplet },
  { name: 'Flooding', desc: 'Heavy street floods, blocked water channels', icon: Maximize2 },
  { name: 'Deforestation', desc: 'Logging parks, illegal tree clearing', icon: Trees },
  { name: 'Other', desc: 'Fallen trees, road hazards, open manholes', icon: AlertTriangle },
];

const severityConfig = [
  { name: 'Low', desc: 'Minor issue, low ecological impact, non-disruptive', color: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  { name: 'Medium', desc: 'Moderate concern, minor blockages, localized damage', color: 'border-yellow-200 bg-yellow-50 text-yellow-800' },
  { name: 'High', desc: 'Severe impact, road hazards, chemical/heavy wastes', color: 'border-orange-250 bg-orange-50 text-orange-850' },
  { name: 'Critical', desc: 'Disaster event, flooding homes, hazardous spillages', color: 'border-red-200 bg-rose-50 text-red-800' },
];

export default function CreateReport() {
  const navigate = useNavigate();
  const { createReport } = useCitizen();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    location: '',
    latitude: 6.5244,
    longitude: 3.3792,
    images: [],
    priority: '',
  });

  const [previews, setPreviews] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newReportId, setNewReportId] = useState(null);
  const [alertMsg, setAlertMsg] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [lightboxType, setLightboxType] = useState('image');

  const hasChanges = formData.category || formData.title || formData.description || formData.images.length > 0 || formData.priority;

  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasChanges]);

  useEffect(() => {
    if (!hasChanges) return;
    const handler = () => {
      if (!window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        window.history.pushState(null, '', window.location.href);
      }
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [hasChanges]);

  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [inputFocused, setInputFocused] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    const address = formData.location?.trim();
    if (!address || address.length < 3) {
      setSuggestions([]);
      return;
    }

    clearTimeout(searchTimer.current);
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5&accept-language=en`
        );
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(searchTimer.current);
  }, [formData.location]);

  const handleSuggestion = (item) => {
    setSuggestions([]);
    setInputFocused(false);
    setFormData(prev => ({
      ...prev,
      location: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }));
  };

  const handleMapClick = useCallback(({ lng, lat }) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleCategorySelect = (cat) => {
    setFormData(prev => ({ ...prev, category: cat }));
    handleNext();
  };

  const handleSeveritySelect = (sev) => {
    setFormData(prev => ({ ...prev, priority: sev }));
    handleNext();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + formData.images.length > 5) {
      setAlertMsg('You can upload a maximum of 5 files.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files],
    }));

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);

    // Mock Upload Progress bar
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 30;
      });
    }, 150);
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index),
    }));
    setPreviews(prev => prev.filter((_, idx) => idx !== index));
    if (formData.images.length <= 1) {
      setUploadProgress(0);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: return !!formData.category;
      case 1: return !!formData.location.trim();
      case 2: return true; // Optional images
      case 3: return formData.title.trim().length >= 5 && formData.description.trim().length >= 20;
      case 4: return !!formData.priority;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let uploadedUrls = [];

      if (formData.images.length > 0) {
        const imageData = new FormData();
        formData.images.forEach((img) => imageData.append('images', img));

        const uploadRes = await axios.post('/api/v1/upload', imageData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (uploadRes.data?.success && uploadRes.data.data?.urls?.length > 0) {
          uploadedUrls = uploadRes.data.data.urls;
        }
      }

      const baseReport = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        category: formData.category,
        priority: formData.priority,
        imageUrl: uploadedUrls[0] || 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?q=80&w=600&auto=format&fit=crop',
        images: uploadedUrls,
      };

      const result = await createReport(baseReport);

      // Clean up blob URLs to prevent memory leaks
      previews.forEach(url => URL.revokeObjectURL(url));
      setPreviews([]);

      setNewReportId(result.id || result._id);
      setCurrentStep(6);
      // Reset form data so unsaved-changes guard clears
      setFormData({
        category: '',
        title: '',
        description: '',
        location: '',
        latitude: 6.5244,
        longitude: 3.3792,
        images: [],
        priority: '',
      });
    } catch (err) {
      console.error('Submission failed:', err);
      setAlertMsg('Failed to log report. Please check details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <SEO title="Create Report" />
      {/* Wizard Header Progress Bar */}
      {currentStep < 6 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Step {currentStep + 1} of 6</span>
            <span>{steps[currentStep]}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / 6) * 100}%` }}
              className="h-full bg-emerald-600 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Slide Animate Container */}
      <div className="min-h-[400px] bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.25 }}
            className="flex-1"
          >
            {/* Step 1: Category */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900">Select Category</h2>
                  <p className="text-xs text-slate-500 font-semibold">What type of environmental issue are you reporting?</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categoryConfig.map(cat => {
                    const CatIcon = cat.icon;
                    const isSelected = formData.category === cat.name;
                    return (
                      <button
                        key={cat.name}
                        onClick={() => handleCategorySelect(cat.name)}
                        className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex gap-3.5 items-start ${
                          isSelected
                            ? 'bg-emerald-50/50 border-emerald-500 text-emerald-800'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl border ${
                          isSelected ? 'bg-white text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400'
                        }`}>
                          <CatIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{cat.name}</h4>
                          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed font-semibold">{cat.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Location Map Picker */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900">Incident Location</h2>
                  <p className="text-xs text-slate-500 font-semibold">Specify address description and verify on the map picker.</p>
                </div>

                <div className="space-y-2 relative">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Address Description</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Surulere canal gutter, Lagos, Nigeria"
                      value={formData.location}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setTimeout(() => setInputFocused(false), 200)}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 pl-10 pr-4 text-sm font-semibold outline-none"
                    />
                    <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    {searching && (
                      <div className="absolute right-3.5 top-3.5 w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                  {inputFocused && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto">
                      {suggestions.map((item, i) => (
                        <button
                          key={i}
                          type="button"
                          onMouseDown={() => handleSuggestion(item)}
                          className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border-b border-slate-100 last:border-0 transition-colors"
                        >
                          <span className="block truncate">{item.display_name}</span>
                          <span className="block text-[11px] text-slate-400 font-semibold mt-0.5">
                            {item.type?.replace(/_/g, ' ') || 'place'} &middot; {item.class}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Map Verification (Click to position marker)</span>
                  <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 z-10 relative">
                    <MapLibreMap
                      center={[formData.longitude, formData.latitude]}
                      zoom={12}
                      showControls={false}
                      interactive={true}
                      onClick={handleMapClick}
                      markers={[{
                        id: 'picker',
                        lng: formData.longitude,
                        lat: formData.latitude,
                        color: '#059669',
                      }]}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                    Selected Coordinates: {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Images evidence Upload */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900">Upload Evidence</h2>
                  <p className="text-xs text-slate-500 font-semibold">Upload photos or videos of the incident. Max 5 files (PNG, JPG, WEBP, MP4, MOV).</p>
                </div>

                {/* Drag and Drop Zone */}
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100/50 transition-colors relative flex flex-col items-center justify-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="h-10 w-10 text-slate-400 mb-4" />
                  <p className="font-bold text-sm text-slate-700">Drag & drop files here, or click to browse</p>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">Photos up to 10MB, videos up to 20MB</p>
                </div>

                {/* Upload progress */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-500">
                      <span>Uploading evidence...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {/* File Previews List */}
                {previews.length > 0 && (
                  <div className="space-y-3">
                    <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Uploaded Files ({previews.length})</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {previews.map((preview, index) => {
                        const isVideo = formData.images[index]?.type?.startsWith('video/');
                        return (
                          <div 
                            key={index} 
                            className="relative h-32 rounded-xl overflow-hidden border border-slate-200 shadow-sm cursor-pointer group"
                            onClick={() => setLightboxIndex(index)}
                          >
                            {isVideo ? (
                              <>
                                <video src={preview} className="w-full h-full object-cover" muted />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-slate-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <img src={preview} alt="Evidence" className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }}
                              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/85 text-white rounded-lg transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            {isVideo && (
                              <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">VIDEO</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Description */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900">Incident Description</h2>
                  <p className="text-xs text-slate-500 font-semibold">Provide title and details to help responders prepare.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Report Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Briefly state the incident, e.g. Open chemicals leaked on highway"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-sm font-semibold outline-none"
                  />
                  <div className="text-[10px] text-right font-semibold text-slate-400">
                    {formData.title.trim().length} / 50 characters max
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Incident Details</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide details about the issue. E.g. what is dumped, ecological threats, estimated size, accessibility..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl py-3 px-4 text-sm font-semibold outline-none"
                  />
                  <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                    <span className={formData.description.trim().length >= 20 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                      Min 20 characters required
                    </span>
                    <span>{formData.description.trim().length} characters entered</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Severity */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-slate-900">Priority Severity</h2>
                  <p className="text-xs text-slate-500 font-semibold">Select priority severity to route dispatchers accordingly.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {severityConfig.map(sev => {
                    const isSelected = formData.priority === sev.name;
                    return (
                      <button
                        key={sev.name}
                        onClick={() => handleSeveritySelect(sev.name)}
                        className={`text-left p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[120px] ${
                          isSelected
                            ? `${sev.color} border-l-4 font-bold`
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <h4 className="font-extrabold text-sm uppercase tracking-wider">{sev.name} Priority</h4>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed font-semibold">{sev.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 6: Preview Details */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="space-y-1 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Preview Submission</h2>
                    <p className="text-xs text-slate-500 font-semibold">Verify details before submitting your report.</p>
                  </div>
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    Unsaved
                  </span>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</span>
                      <p className="text-sm font-bold text-slate-800">{formData.category}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Priority Severity</span>
                      <p className="text-sm font-bold text-slate-800">{formData.priority} Priority</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location Address</span>
                      <p className="text-sm font-bold text-slate-800 flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {formData.location}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Incident title & details</span>
                    <h4 className="font-extrabold text-sm text-slate-800">{formData.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">{formData.description}</p>
                  </div>

                  {previews.length > 0 && (
                    <div className="space-y-2">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attached files ({previews.length})</span>
                      <div className="flex gap-3 overflow-x-auto py-1">
                        {previews.map((src, i) => {
                          const isVideo = formData.images[i]?.type?.startsWith('video/');
                          return (
                            <div 
                              key={i} 
                              className="h-20 w-28 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 cursor-pointer hover:border-emerald-400 transition-colors relative"
                              onClick={() => setLightboxIndex(i)}
                            >
                              {isVideo ? (
                                <>
                                  <video src={src} className="w-full h-full object-cover" muted />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </div>
                                </>
                              ) : (
                                <img src={src} alt="Preview" className="w-full h-full object-cover" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 7: Success Animation — Report Activation */}
            {currentStep === 6 && (
              <div className="relative text-center py-8 space-y-6 overflow-hidden">
                {/* Leaf burst celebration */}
                <div className="absolute inset-0 z-10">
                  <LeafBurst fire count={18} size="md" />
                </div>

                {/* Mini map with sonar activation */}
                <div className="relative w-full max-w-sm mx-auto h-44 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                  <MapLibreMap
                    mapRef={null}
                    static
                    interactive={false}
                    showControls={false}
                    center={[formData.longitude || 3.3792, formData.latitude || 6.5244]}
                    zoom={13}
                    markers={[{ id: 'new-report', lng: formData.longitude || 3.3792, lat: formData.latitude || 6.5244, color: '#059669' }]}
                    className="w-full h-full"
                  />
                  {/* Sonar rings on the pin */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 pointer-events-none">
                    <div className="ga-ripple" />
                    <div className="ga-ripple" style={{ animationDelay: '0.5s' }} />
                  </div>
                </div>

                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.15 }}
                  className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto text-4xl shadow-md"
                >
                  ✓
                </motion.div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold text-slate-900">Report Logged Successfully!</h2>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                    Your environmental incident has been submitted. We have auto-routed coordinates to the nearest dispatch organization.
                  </p>
                </div>
                <div className="pt-6 flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={() => navigate(`/citizen-dashboard/reports/${newReportId}`)}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-all active:scale-98 cursor-pointer text-sm"
                  >
                    View Submitted Report
                  </button>
                  <button
                    onClick={() => {
                      setFormData({
                        category: '',
                        title: '',
                        description: '',
                        location: '',
                        latitude: 6.5244,
                        longitude: 3.3792,
                        images: [],
                        priority: '',
                      });
                      setPreviews([]);
                      setUploadProgress(0);
                      setCurrentStep(0);
                    }}
                    className="px-6 py-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all active:scale-98 cursor-pointer text-sm"
                  >
                    Submit Another Report
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Wizard Bottom navigation Buttons */}
        {currentStep < 6 && (
          <div className="flex justify-between items-center pt-8 border-t border-slate-100 mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            {currentStep === 5 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? 'Logging Incident...' : 'Submit Report'}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-600 text-white disabled:opacity-45 disabled:cursor-not-allowed text-xs font-bold rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center gap-1.5"
              >
                Next Step
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex >= 0 && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxIndex(-1)}>
          <button 
            onClick={() => setLightboxIndex(-1)}
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev > 0 ? prev - 1 : previews.length - 1); }}
            className="absolute left-4 text-white/80 hover:text-white z-10"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev < previews.length - 1 ? prev + 1 : 0); }}
            className="absolute right-4 text-white/80 hover:text-white z-10"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="max-w-4xl max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {formData.images[lightboxIndex]?.type?.startsWith('video/') || previews[lightboxIndex]?.endsWith('.mp4') || previews[lightboxIndex]?.endsWith('.mov') ? (
              <video src={previews[lightboxIndex]} controls className="max-w-full max-h-[85vh] rounded-lg" />
            ) : (
              <img src={previews[lightboxIndex]} alt="Full preview" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
            )}
          </div>
          <div className="absolute bottom-4 text-white/60 text-sm font-semibold">
            {lightboxIndex + 1} / {previews.length}
          </div>
        </div>
      )}

      <AlertModal isOpen={!!alertMsg} message={alertMsg} onClose={() => setAlertMsg('')} />
    </div>
  );
}
