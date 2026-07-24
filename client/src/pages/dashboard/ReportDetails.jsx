import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MapLibreMap from '../../components/map/MapLibreMap';
import {
  ArrowLeft,
  Bookmark,
  Trash2,
  Calendar,
  MapPin,
  Clock,
  Building,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { useCitizen } from '../../contexts/CitizenContext';
import { useConfirm } from '../../components/ui/ConfirmModal';
import axios from 'axios';
import SEO from '../../components/SEO';
import DiscussionSection from '../../components/ui/DiscussionSection';
import ShareButton from '../../components/ui/ShareButton';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?q=80&w=1200&auto=format&fit=crop';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import ErrorState from '../../components/ui/ErrorState';
import BeforeAfterSlider from '../../components/ui/BeforeAfterSlider';
import PDFReportGenerator from '../../components/ui/PDFReportGenerator';

const workflowStatuses = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
  'Closed',
];

export default function ReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getReportDetails, savedReports, toggleSaveReport, deleteReport, addComment } = useCitizen();
  const { confirm, ConfirmDialog } = useConfirm();
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReportDetails(id);
      if (!data) {
        setError('Report not found');
      } else {
        setReport(data);
      }
    } catch (err) {
      setError('Failed to load report details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [id]);


  const handleBookmarkToggle = () => {
    if (report) {
      toggleSaveReport(report.id || report._id);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !report) return;

    setSubmittingComment(true);
    try {
      await addComment(report.id || report._id, commentText);
      setCommentText('');
      // Reload report details to reflect the new comment
      await loadReport();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleExportPDF = () => {
    const container = document.getElementById('report-content');
    if (container) {
      container.classList.add('print-report');
    }
    window.print();
    if (container) {
      container.classList.remove('print-report');
    }
  };

  if (loading) return <LoadingSkeleton type="profile" />;
  if (error || !report) return <ErrorState title="Report not found" message={error || "The report you're looking for does not exist."} onRetry={loadReport} />;

  const isSaved = savedReports.includes(report.id || report._id);
  const currentStatusIndex = workflowStatuses.indexOf(report.status);

  // Fallback coordinates for Lagos if missing
  const lat = report.latitude || 6.5244;
  const lng = report.longitude || 3.3792;

  return (
    <div className="space-y-6 pb-12">
      <SEO title={report?.title || 'Report Details'} description={report?.description?.substring(0, 160)} image={report?.images?.[0] || report?.imageUrl} />
      {/* Top Header Buttons */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          Back to Reports
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBookmarkToggle}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isSaved
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                : 'bg-white hover:bg-slate-50 text-slate-400 border-slate-200'
            }`}
            title={isSaved ? 'Unsave Report' : 'Save Report'}
          >
            <Bookmark className="h-5 w-5" fill={isSaved ? 'currentColor' : 'none'} />
          </button>
          <ShareButton reportId={report.id || report._id} reportTitle={report.title} />
          <PDFReportGenerator report={report} />
          <button
            onClick={async () => {
              const ok = await confirm('Are you sure you want to delete this report?');
              if (!ok) return;
              try {
                await deleteReport(report.id || report._id);
                navigate('/citizen-dashboard/my-reports');
              } catch {}
            }}
            className="p-2.5 bg-white hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 rounded-xl transition-colors cursor-pointer shadow-sm"
            title="Delete Report"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Grid Detail Page Layout */}
      <div id="report-content" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Image, Details, Maps */}
        <div className="lg:col-span-2 space-y-8">

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
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Incident Image / Gallery */}
            {(() => {
              const allMedia = (report.images && report.images.length > 0) 
                ? report.images 
                : (report.imageUrl ? [report.imageUrl] : []);
              const hasMedia = allMedia.length > 0;
              
              return hasMedia ? (
                <div className="space-y-2">
                  {/* Main large image */}
                  <div className="h-96 w-full bg-slate-100 relative cursor-pointer overflow-hidden group" onClick={() => setLightboxIndex(0)}>
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
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
                    {allMedia.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        1 / {allMedia.length}
                      </div>
                    )}
                  </div>
                  {/* Thumbnail strip */}
                  {allMedia.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto px-1 py-1">
                      {allMedia.map((media, i) => {
                        const isVideo = media?.includes('.mp4') || media?.includes('.mov') || media?.includes('video');
                        return (
                          <div
                            key={i}
                            className="h-16 w-20 flex-shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:border-emerald-400"
                            onClick={() => setLightboxIndex(i)}
                          >
                            {isVideo ? (
                              <div className="relative h-full w-full bg-slate-800">
                                <video src={media} className="h-full w-full object-cover" muted />
                                <div className="absolute inset-0 flex items-center justify-center">
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
                <div className="h-96 w-full bg-slate-100 relative overflow-hidden group">
                  <img src={FALLBACK_IMAGE} alt={report.title} className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
                </div>
              );
            })()}

            {/* Content Details */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/50 uppercase tracking-wider">
                  {report.category}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 border rounded uppercase tracking-wider ${
                  report.priority === 'Critical' ? 'text-red-700 bg-red-50 border-red-200' :
                  report.priority === 'High' ? 'text-orange-750 bg-orange-50 border-orange-200' :
                  report.priority === 'Medium' ? 'text-yellow-700 bg-yellow-50 border-yellow-200' :
                  'text-slate-600 bg-slate-50 border-slate-200'
                }`}>
                  {report.priority || 'Medium'} Priority
                </span>
              </div>

              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                  {report.title}
                </h1>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm text-slate-500 font-semibold pt-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4.5 w-4.5 text-slate-400" />
                    <span>{report.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4.5 w-4.5 text-slate-400" />
                    <span>
                      {report.createdAt ? new Date(report.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="space-y-3">
                <h3 className="font-bold text-slate-800">Incident Details</h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-[15px]">
                  {report.description}
                </p>
              </div>
            </div>
          </div>

          {/* Map Preview */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-600" />
              Incident Geolocation
            </h3>
            <div className="h-72 rounded-2xl overflow-hidden border border-slate-200">
              <MapLibreMap
                center={[lng, lat]}
                zoom={14}
                interactive={false}
                showControls={false}
                markers={[{ id: 'report-location', lng, lat, color: '#059669' }]}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* Right Column - Status Flow, Comments, Responders */}
        <div className="space-y-6">
          
          {/* Status Tracker */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              Progress Workflow
            </h3>
            
            {/* Vertical Progress Timeline */}
            <div className="relative pl-8 space-y-6 border-l border-slate-200 ml-3.5">
              {workflowStatuses.map((status, index) => {
                const isCompleted = index < currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                const isFuture = index > currentStatusIndex;

                return (
                  <div key={status} className="relative">
                    {/* Circle Node */}
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

                    <div className="space-y-0.5">
                      <p className={`text-sm font-bold ${
                        isCurrent ? 'text-emerald-700' :
                        isCompleted ? 'text-slate-800' : 'text-slate-400'
                      }`}>
                        {status}
                      </p>
                      {isCurrent && (
                        <p className="text-[11px] text-slate-500 font-semibold">
                          Active stage
                        </p>
                      )}
                      {index === 0 && (
                        <p className="text-[10px] text-slate-400 font-medium">
                          {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>



          {/* Assigned responder Agency */}
          {report.assignedTo && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
                <Building className="h-6 w-6" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-semibold">Assigned Responder</p>
                <h4 className="font-bold text-slate-800 text-sm">{report.assignedTo.fullName}</h4>
                <p className="text-xs text-slate-400">Verified Government Agency</p>
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="no-print">
            <DiscussionSection reportId={id} />
          </div>
        </div>
      </div>
      <ConfirmDialog />

      {/* Lightbox */}
      {lightboxIndex >= 0 && (() => {
        const allMedia = (report.images && report.images.length > 0) 
          ? report.images 
          : (report.imageUrl ? [report.imageUrl] : []);
        const isVideo = allMedia[lightboxIndex]?.includes('.mp4') || allMedia[lightboxIndex]?.includes('.mov') || allMedia[lightboxIndex]?.includes('video');
        return (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxIndex(-1)}>
            <button onClick={() => setLightboxIndex(-1)} className="absolute top-4 right-4 text-white/80 hover:text-white z-10">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev > 0 ? prev - 1 : allMedia.length - 1); }} className="absolute left-4 text-white/80 hover:text-white z-10">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev < allMedia.length - 1 ? prev + 1 : 0); }} className="absolute right-14 text-white/80 hover:text-white z-10">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
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
