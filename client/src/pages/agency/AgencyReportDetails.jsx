import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Calendar, Clock, User, Building2,
  CheckCircle, FileText, Upload, Loader2, Camera, ShieldCheck, X,
} from 'lucide-react';
import axios from 'axios';
import { useCitizen } from '../../contexts/CitizenContext';
import DiscussionSection from '../../components/ui/DiscussionSection';
import BeforeAfterSlider from '../../components/ui/BeforeAfterSlider';
import PDFReportGenerator from '../../components/ui/PDFReportGenerator';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?q=80&w=1200&auto=format&fit=crop';

const workflowStatuses = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
const agencyStatuses = ['Assigned', 'In Progress', 'Resolved', 'Closed'];

const statusColors = {
  Resolved:      'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Under Review':'bg-amber-100 text-amber-700 border-amber-200',
  Assigned:      'bg-blue-100 text-blue-700 border-blue-200',
  'In Progress': 'bg-violet-100 text-violet-700 border-violet-200',
  Closed:        'bg-slate-200 text-slate-600 border-slate-300',
  Submitted:     'bg-slate-100 text-slate-600 border-slate-200',
};

const priorityColors = {
  Critical: 'bg-red-50 text-red-700 border-red-200',
  High:     'bg-orange-50 text-orange-700 border-orange-200',
  Medium:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  Low:      'bg-slate-50 text-slate-600 border-slate-200',
};

export default function AgencyReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useCitizen();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  // Resolution proof state
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionImages, setResolutionImages] = useState([]);
  const [uploadingResolution, setUploadingResolution] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchReport = async () => {
    try {
      const { data } = await axios.get(`/api/v1/reports/${id}`, { headers });
      setReport(data);
    } catch {
      setError('Report not found or access denied.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id, token]);

  const handleUploadResolutionImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingResolution(true);
    try {
      const formData = new FormData();
      formData.append('images', file);
      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        const url = res.data.data.urls?.[0] || res.data.data.url;
        setResolutionImages((prev) => [...prev, url]);
      }
    } catch (err) {
      console.error('Resolution image upload failed:', err);
    } finally {
      setUploadingResolution(false);
    }
  };

  const handleStatusChange = (status) => {
    if (status === 'Resolved' || status === 'Closed') {
      setPendingStatus(status);
      setShowResolutionModal(true);
    } else {
      submitStatusChange(status, [], '');
    }
  };

  const submitStatusChange = async (status, images, notes) => {
    setSavingStatus(true);
    try {
      await axios.patch(
        `/api/v1/agency/reports/${id}/status`,
        { status, resolutionImages: images, resolutionNotes: notes },
        { headers }
      );
      setReport((prev) => ({
        ...prev,
        status,
        resolutionImages: images.length > 0 ? images : prev.resolutionImages,
        resolutionNotes: notes || prev.resolutionNotes,
        resolvedAt: (status === 'Resolved' || status === 'Closed') ? new Date().toISOString() : prev.resolvedAt,
      }));
      setShowResolutionModal(false);
      setResolutionImages([]);
      setResolutionNotes('');
      setPendingStatus(null);
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="text-center py-16">
        <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 text-sm font-semibold">{error || 'Report not found.'}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-xs font-bold text-amber-600 hover:underline cursor-pointer">
          ← Go back
        </button>
      </div>
    );
  }

  const currentStatusIndex = workflowStatuses.indexOf(report.status);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reports
        </button>
        <div className="flex items-center gap-2">
          <PDFReportGenerator report={report} />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agency View</span>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            {/* Incident Image / Video Gallery */}
            {(() => {
              const allMedia = (report.images && report.images.length > 0)
                ? report.images
                : (report.imageUrl ? [report.imageUrl] : []);
              const hasMedia = allMedia.length > 0;

              return hasMedia ? (
                <div className="space-y-2">
                  <div className="h-80 w-full bg-slate-100 relative cursor-pointer overflow-hidden group" onClick={() => setLightboxIndex(0)}>
                    {allMedia[0]?.includes('.mp4') || allMedia[0]?.includes('.mov') || allMedia[0]?.includes('video') ? (
                      <video src={allMedia[0]} className="h-full w-full object-cover" controls />
                    ) : (
                      <img
                        src={allMedia[0]}
                        alt={report.title}
                        onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${statusColors[report.status] || statusColors.Submitted}`}>
                        {report.status}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${priorityColors[report.priority] || priorityColors.Medium}`}>
                        {report.priority || 'Medium'} Priority
                      </span>
                    </div>
                    {allMedia.length > 1 && (
                      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full z-10">
                        1 / {allMedia.length}
                      </div>
                    )}
                  </div>
                  {/* Thumbnail strip */}
                  {allMedia.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto px-4 py-2 bg-slate-50 border-t border-slate-100">
                      {allMedia.map((media, i) => {
                        const isVideo = media?.includes('.mp4') || media?.includes('.mov') || media?.includes('video');
                        return (
                          <div
                            key={i}
                            className="h-16 w-20 flex-shrink-0 rounded-xl overflow-hidden border-2 border-slate-200 hover:border-amber-500 cursor-pointer transition-all shadow-sm"
                            onClick={() => setLightboxIndex(i)}
                          >
                            {isVideo ? (
                              <div className="relative h-full w-full bg-slate-800 flex items-center justify-center">
                                <video src={media} className="h-full w-full object-cover" muted />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              </div>
                            ) : (
                              <img src={media} alt="" className="h-full w-full object-cover" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-80 w-full bg-slate-100 relative overflow-hidden group">
                  <img src={FALLBACK_IMAGE} alt={report.title} className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                </div>
              );
            })()}

            {/* Details */}
            <div className="p-6 space-y-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                  {report.category}
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-3 leading-tight">{report.title}</h2>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-semibold">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  {report.location}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {new Date(report.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  {report.user?.fullName || 'Unknown'}
                </div>
              </div>

              <hr className="border-slate-100" />

              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-sm text-slate-700 leading-relaxed">{report.description}</p>
              </div>
            </div>
          </motion.div>

          {/* Before & After Slider */}
          {report.resolutionImages?.length > 0 && (
            <BeforeAfterSlider
              beforeImage={report.imageUrl || report.images?.[0]}
              afterImage={report.resolutionImages[0]}
              resolutionNotes={report.resolutionNotes}
              resolvedAt={report.resolvedAt}
              agencyName={report.assignedTo?.name}
            />
          )}

          {/* Agency Action Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
          >
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-600" />
              Update Report Status
            </h3>
            <p className="text-xs text-slate-500">
              Change the status of this report. When marking as <strong>Resolved</strong> or <strong>Closed</strong>, you'll be asked to upload a resolution proof photo.
            </p>
            <div className="flex flex-wrap gap-2">
              {agencyStatuses.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={savingStatus || report.status === s}
                  className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    report.status === s
                      ? (statusColors[s] || 'bg-slate-100 text-slate-600 border-slate-200')
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700'
                  }`}
                >
                  {report.status === s && <span className="mr-1">✓</span>}
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
          
          <DiscussionSection reportId={id} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Progress Workflow */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
          >
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-6">
              <Clock className="h-4 w-4 text-amber-600" />
              Progress Workflow
            </h3>
            <div className="relative pl-8 space-y-6 border-l border-slate-200 ml-3.5">
              {workflowStatuses.map((status, index) => {
                const isCompleted = index < currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                return (
                  <div key={status} className="relative">
                    <div className={`absolute -left-11.5 top-0.5 w-7 h-7 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-all ${
                      isCompleted ? 'bg-amber-500 text-white' :
                      isCurrent ? 'bg-white border-amber-500 ring-2 ring-amber-500/20 text-amber-600 scale-105' :
                      'bg-slate-100 border-slate-200 text-slate-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-amber-500 animate-ping' : 'bg-slate-400'}`} />
                      )}
                    </div>
                    <p className={`text-sm font-bold ${
                      isCurrent ? 'text-amber-700' :
                      isCompleted ? 'text-slate-800' : 'text-slate-400'
                    }`}>
                      {status}
                    </p>
                    {isCurrent && <p className="text-[11px] text-slate-500 font-semibold">Active stage</p>}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Reporter Info */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
          >
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2 mb-4">
              <User className="h-4 w-4 text-amber-600" />
              Reporter Info
            </h3>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-sm font-extrabold text-amber-700">
                {report.user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{report.user?.fullName || 'Unknown'}</p>
                <p className="text-[11px] text-slate-500">{report.user?.email || '—'}</p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                  {report.user?.role || 'citizen'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Resolution Proof Modal */}
      {showResolutionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md space-y-5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200">
                <ShieldCheck className="h-5 w-5 text-amber-600" />
              </span>
              <div>
                <h3 className="font-extrabold text-slate-900">Resolution Proof Required</h3>
                <p className="text-xs text-slate-500">Upload a photo proving the environmental hazard has been resolved.</p>
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Clean-Up Verification Photo
              </label>
              {resolutionImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {resolutionImages.map((url, i) => (
                    <div key={i} className="h-20 rounded-xl overflow-hidden border border-slate-200">
                      <img src={url} alt={`Resolution ${i + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : null}
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-amber-300 rounded-2xl bg-amber-50/50 cursor-pointer hover:bg-amber-50 transition-colors">
                {uploadingResolution ? (
                  <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
                ) : (
                  <>
                    <Camera className="h-6 w-6 text-amber-500 mb-1.5" />
                    <span className="text-xs font-bold text-amber-700">{resolutionImages.length > 0 ? 'Add Another Photo' : 'Upload Resolution Photo'}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">JPG, PNG or WEBP</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadResolutionImage}
                  className="hidden"
                  disabled={uploadingResolution}
                />
              </label>
            </div>

            {/* Resolution Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Agency Resolution Notes <span className="text-slate-400 font-normal normal-case">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Describe what was done to resolve the incident..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResolutionModal(false);
                  setPendingStatus(null);
                  setResolutionImages([]);
                  setResolutionNotes('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => submitStatusChange(pendingStatus, resolutionImages, resolutionNotes)}
                disabled={savingStatus}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold cursor-pointer transition-colors disabled:opacity-70 flex items-center justify-center gap-1.5"
              >
                {savingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Confirm {pendingStatus}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {lightboxIndex >= 0 && (() => {
        const allMedia = (report.images && report.images.length > 0)
          ? report.images
          : (report.imageUrl ? [report.imageUrl] : []);
        const isVideo = allMedia[lightboxIndex]?.includes('.mp4') || allMedia[lightboxIndex]?.includes('.mov') || allMedia[lightboxIndex]?.includes('video');
        return (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxIndex(-1)}>
            <button onClick={() => setLightboxIndex(-1)} className="absolute top-4 right-4 text-white/80 hover:text-white z-10 cursor-pointer">
              <X className="w-8 h-8" />
            </button>
            {allMedia.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev > 0 ? prev - 1 : allMedia.length - 1); }} className="absolute left-4 text-white/80 hover:text-white z-10 cursor-pointer">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev < allMedia.length - 1 ? prev + 1 : 0); }} className="absolute right-4 text-white/80 hover:text-white z-10 cursor-pointer">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            <div className="max-w-4xl max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              {isVideo ? (
                <video src={allMedia[lightboxIndex]} controls className="max-w-full max-h-[85vh] rounded-lg" />
              ) : (
                <img src={allMedia[lightboxIndex]} alt="Full view" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
              )}
            </div>
            <div className="absolute bottom-4 text-white/60 text-sm font-semibold">{lightboxIndex + 1} / {allMedia.length}</div>
          </div>
        );
      })()}
    </div>
  );
}
