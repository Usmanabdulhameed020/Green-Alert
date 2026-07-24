import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Calendar, Clock, User, Building2,
  Tag, AlertTriangle, CheckCircle, BrainCircuit, Sparkles,
  X, Image as ImageIcon, FileText,
} from 'lucide-react';
import axios from 'axios';
import { useCitizen } from '../../contexts/CitizenContext';
import DiscussionSection from '../../components/ui/DiscussionSection';
import BeforeAfterSlider from '../../components/ui/BeforeAfterSlider';
import PDFReportGenerator from '../../components/ui/PDFReportGenerator';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?q=80&w=1200&auto=format&fit=crop';

const workflowStatuses = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

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

export default function AdminReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useCitizen();

  const [report, setReport] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignModal, setAssignModal] = useState(false);
  const [savingAssign, setSavingAssign] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchReport = async () => {
    try {
      const { data } = await axios.get(`/api/v1/admin/reports/${id}`, { headers });
      setReport(data);
    } catch (err) {
      // fallback to generic report endpoint
      try {
        const { data } = await axios.get(`/api/v1/reports/${id}`, { headers });
        setReport(data);
      } catch {
        setError('Report not found.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgs = async () => {
    try {
      const { data } = await axios.get('/api/v1/admin/organizations', { headers });
      setOrganizations(data);
    } catch {}
  };

  useEffect(() => {
    fetchReport();
    fetchOrgs();
  }, [id, token]);


  const handleAssign = async (orgId) => {
    setSavingAssign(true);
    try {
      const { data } = await axios.patch(`/api/v1/admin/reports/${id}/assign`, { organizationId: orgId }, { headers });
      setReport(data);
      setAssignModal(false);
    } catch (err) {
      console.error('Assign failed:', err);
    } finally {
      setSavingAssign(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="text-center py-16">
        <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 text-sm font-semibold">{error || 'Report not found.'}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-xs font-bold text-emerald-600 hover:underline cursor-pointer">
          ← Go back
        </button>
      </div>
    );
  }

  const currentStatusIndex = workflowStatuses.indexOf(report.status);
  const lat = report.latitude || 6.5244;
  const lng = report.longitude || 3.3792;

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
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Admin View</span>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Before & After Slider for Resolved Reports */}
          {report.resolutionImages?.length > 0 && (
            <BeforeAfterSlider
              beforeImage={report.imageUrl || report.images?.[0]}
              afterImage={report.resolutionImages[0]}
              resolutionNotes={report.resolutionNotes}
              resolvedAt={report.resolvedAt}
              agencyName={report.assignedTo?.name}
            />
          )}

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
                            className="h-16 w-20 flex-shrink-0 rounded-xl overflow-hidden border-2 border-slate-200 hover:border-emerald-500 cursor-pointer transition-all shadow-sm"
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
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
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

          {/* Admin Actions Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5"
          >
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" />
              Organization Assignment
            </h3>

            {/* Assignment */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Assigned Organization</label>
              {report.assignedTo ? (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">{report.assignedTo.name}</p>
                      <p className="text-[10px] text-slate-500">{report.assignedTo.category} · {report.assignedTo.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAssignModal(true)}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-white border border-blue-200 px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    Reassign
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAssignModal(true)}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl cursor-pointer transition-all hover:bg-emerald-100"
                >
                  + Assign to Organization
                </button>
              )}
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
              <Clock className="h-4 w-4 text-emerald-600" />
              Progress Workflow
            </h3>
            <div className="relative pl-8 space-y-6 border-l border-slate-200 ml-3.5">
              {workflowStatuses.map((status, index) => {
                const isCompleted = index < currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                return (
                  <div key={status} className="relative">
                    <div className={`absolute -left-11.5 top-0.5 w-7 h-7 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-all ${
                      isCompleted ? 'bg-emerald-600 text-white' :
                      isCurrent ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-600 scale-105' :
                      'bg-slate-100 border-slate-200 text-slate-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-emerald-600 animate-ping' : 'bg-slate-400'}`} />
                      )}
                    </div>
                    <p className={`text-sm font-bold ${
                      isCurrent ? 'text-emerald-700' :
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
              <User className="h-4 w-4 text-emerald-600" />
              Reporter Info
            </h3>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-extrabold text-emerald-700">
                {report.user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{report.user?.fullName || 'Unknown'}</p>
                <p className="text-[11px] text-slate-500">{report.user?.email || '—'}</p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                  {report.user?.role || 'citizen'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* AI Analysis */}
          {report.aiAnalyzed && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
            >
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-emerald-600" />
                AI Analysis
              </h3>

              <div className="space-y-3">
                {report.aiCategory && report.aiCategory !== report.category && (
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Category</p>
                      <p className="text-xs font-bold text-slate-700">{report.aiCategory}</p>
                    </div>
                  </div>
                )}
                {report.aiSummary && (
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Summary</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{report.aiSummary}</p>
                    </div>
                  </div>
                )}
                {report.aiSeverity && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${
                      report.aiSeverity === 'Critical' ? 'text-rose-500' :
                      report.aiSeverity === 'High' ? 'text-orange-500' :
                      report.aiSeverity === 'Medium' ? 'text-yellow-500' : 'text-slate-400'
                    }`} />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Severity Assessment</p>
                      <p className="text-xs font-bold text-slate-700">{report.aiSeverity}</p>
                    </div>
                  </div>
                )}
                {report.aiSuggestedOrg && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Agency</p>
                      <p className="text-xs font-bold text-slate-700">{report.aiSuggestedOrg}</p>
                    </div>
                  </div>
                )}
                {report.aiDuplicateOf && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <X className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Potential Duplicate</p>
                      <p className="text-xs text-amber-800 font-semibold">
                        Similar to: "{report.aiDuplicateOf.title}" — {report.aiDuplicateOf.location}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" onClick={() => setAssignModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-extrabold text-slate-900 mb-1">Assign Report</h3>
            <p className="text-xs text-slate-500 mb-4">Select a verified organization to handle this report.</p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {organizations.filter((o) => o.verified).map((org) => (
                <button
                  key={org._id}
                  onClick={() => handleAssign(org._id)}
                  disabled={savingAssign}
                  className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-xs font-semibold text-slate-800 cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-amber-500 shrink-0" />
                    <div>
                      <p>{org.name}</p>
                      <p className="text-[10px] text-slate-500 font-normal">{org.category} · {org.email}</p>
                    </div>
                  </div>
                </button>
              ))}
              {organizations.filter((o) => o.verified).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No verified organizations available.</p>
              )}
            </div>
            <button
              onClick={() => setAssignModal(false)}
              className="mt-4 w-full text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 px-4 py-2.5 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
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
