import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, MapPin, Navigation } from 'lucide-react';
import { useCitizen } from '../../contexts/CitizenContext';
import { useSocket } from '../../contexts/SocketContext';
import MapLibreMap from '../../components/map/MapLibreMap';
import { MapSearchBar, LocateMeButton } from '../../components/map/MapControls';
import StatusBadge from '../../components/ui/StatusBadge';

const CATEGORIES = ['Air Quality', 'Water', 'Waste', 'Noise', 'Deforestation', 'Biodiversity', 'Other'];

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function computeHotspotPairs(reports, maxKm = 8, maxPairs = 12) {
  const pairs = [];
  const byCat = {};
  reports.forEach((r) => {
    if (r.latitude && r.longitude) {
      (byCat[r.category || 'Other'] ||= []).push(r);
    }
  });
  for (const cat of Object.keys(byCat)) {
    const list = byCat[cat];
    for (let i = 0; i < list.length && pairs.length < maxPairs; i++) {
      for (let j = i + 1; j < list.length && pairs.length < maxPairs; j++) {
        if (haversineKm(list[i], list[j]) <= maxKm) pairs.push([list[i], list[j]]);
      }
    }
  }
  return pairs.slice(0, maxPairs);
}

export default function MapPage() {
  const navigate = useNavigate();
  const { allReports, fetchAllReports } = useCitizen();
  const { on } = useSocket();
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [arcPaths, setArcPaths] = useState([]);

  useEffect(() => {
    fetchAllReports();
  }, []);

  // ── Living Map: react to live socket events with sonar pulses ──
  const [pulses, setPulses] = useState([]);

  const triggerPulse = useCallback((id, color = '#059669') => {
    if (!id) return;
    setPulses((prev) => [...prev, { id, color }]);
    setTimeout(() => {
      setPulses((prev) => prev.filter((x) => x.id !== id));
    }, 2400);
  }, []);

  useEffect(() => {
    const offNew = on('report:new', (r) => triggerPulse(r._id || r.id, '#059669'));
    const offAssigned = on('report:assigned', (r) => triggerPulse(r._id || r.id, '#3b82f6'));
    const offStatus = on('report:status-changed', (r) => triggerPulse(r._id || r.id, '#f59e0b'));
    return () => { offNew(); offAssigned(); offStatus(); };
  }, [on, triggerPulse]);

  const filteredReports = useMemo(() => {
    let list = allReports.filter(r => r.latitude && r.longitude);
    if (selectedCategories.length > 0) {
      list = list.filter(r => selectedCategories.includes(r.category));
    }
    if (selectedStatuses.length > 0) {
      list = list.filter(r => selectedStatuses.includes(r.status));
    }
    return list;
  }, [allReports, selectedCategories, selectedStatuses]);

  // ── Telemetry arcs: project hotspot connections onto the map ──
  const updateArcs = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const pairs = computeHotspotPairs(filteredReports);
    setArcPaths(
      pairs.map(([a, b]) => {
        const pa = map.project([a.longitude, a.latitude]);
        const pb = map.project([b.longitude, b.latitude]);
        const mx = (pa.x + pb.x) / 2;
        const my = (pa.y + pb.y) / 2;
        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const len = Math.hypot(dx, dy) || 1;
        const lift = Math.min(70, len * 0.28);
        const cx = mx - (dy / len) * lift;
        const cy = my + (dx / len) * lift;
        return `M ${pa.x.toFixed(1)} ${pa.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${pb.x.toFixed(1)} ${pb.y.toFixed(1)}`;
      })
    );
  }, [mapReady, filteredReports]);

  useEffect(() => {
    updateArcs();
    const map = mapRef.current;
    if (!map) return;
    map.on('move', updateArcs);
    map.on('zoom', updateArcs);
    return () => { map.off('move', updateArcs); map.off('zoom', updateArcs); };
  }, [updateArcs, mapReady]);

  const markers = useMemo(() => {
    return filteredReports.map(r => {
      const reportId = r._id || r.id;
      const activePulse = pulses.find((p) => p.id === reportId);
      return {
        id: reportId,
        lng: r.longitude,
        lat: r.latitude,
        color: '#059669',
        pulse: !!activePulse,
        pulseColor: activePulse?.color || '#059669',
        popupHtml: `
        <div style="font-family: system-ui, sans-serif; max-width: 240px; padding: 4px;">
          <h4 style="margin: 0 0 4px; font-size: 13px; font-weight: 800; color: #1e293b; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${(r.title || '').replace(/</g, '&lt;')}
          </h4>
          <p style="margin: 0 0 4px; font-size: 11px; color: #64748b; font-weight: 600;">
            ${(r.location || '').replace(/</g, '&lt;')}
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 6px; border-top: 1px solid #f1f5f9;">
            <span style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 8px; background: ${statusColor(r.status)}; color: white;">
              ${(r.status || 'Unknown').replace(/_/g, ' ')}
            </span>
            <a href="/citizen-dashboard/reports/${r._id || r.id}" style="font-size: 11px; font-weight: 700; color: #059669; text-decoration: none;">
              Details →
            </a>
          </div>
        </div>
      `,
      };
    });
  }, [filteredReports, pulses]);

  const handleLocated = useCallback((lng, lat) => {
    const map = mapRef.current || mapInstance();
    if (map) map.flyTo({ center: [lng, lat], zoom: 14, duration: 1000 });
  }, []);

  const handleSearchResult = useCallback((lng, lat) => {
    const map = mapRef.current || mapInstance();
    if (map) map.flyTo({ center: [lng, lat], zoom: 14, duration: 1000 });
  }, []);

  const handleMarkerClick = useCallback((reportId) => {
    navigate(`/citizen-dashboard/reports/${reportId}`);
  }, [navigate]);

  const toggleCategory = (cat) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleStatus = (status) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedStatuses([]);
  };

  const hasFilters = selectedCategories.length > 0 || selectedStatuses.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)] -mx-4 sm:-mx-6 lg:-mx-8 -mb-8 overflow-hidden"
    >
      <MapLibreMap
        mapRef={mapRef}
        markers={markers}
        clusterMarkers={true}
        fitBoundsToMarkers={true}
        showControls={true}
        onMapLoad={() => setMapReady(true)}
        className="w-full h-full min-h-[500px]"
      >
        {/* Radar sweep overlay */}
        <div className="ga-radar z-[5]" />

        {/* Telemetry hotspot arcs */}
        {arcPaths.length > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" aria-hidden>
            {arcPaths.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="rgba(16,185,129,0.65)"
                strokeWidth={2}
                className="ga-arc"
                style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.6))' }}
              />
            ))}
          </svg>
        )}

        {/* Top overlay */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-start gap-3">
          <div className="flex-1 max-w-md">
            <MapSearchBar onResult={handleSearchResult} />
          </div>
          <div className="flex items-center gap-2">
            <LocateMeButton onLocated={handleLocated} />
            <button
              onClick={() => setShowFilters(true)}
              className={`h-9 px-3 flex items-center gap-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border shadow-lg ${
                hasFilters
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white/95 backdrop-blur-sm text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {hasFilters && <span className="w-4 h-4 bg-white/20 rounded-full text-[9px] flex items-center justify-center">{selectedCategories.length + selectedStatuses.length}</span>}
            </button>
          </div>
        </div>

        {/* Bottom info bar */}
        <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-2 shadow-lg">
          <p className="text-[10px] font-semibold text-slate-500">
            {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'} on map
          </p>
        </div>
      </MapLibreMap>

      {/* Filters Drawer */}
      <AnimatePresence>
        {showFilters && (
          <>
            <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setShowFilters(false)} />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-white border-l border-slate-200 z-40 shadow-2xl overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-base">Filters</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Category</h4>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                          selectedCategories.includes(cat)
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {['open', 'assigned', 'resolved'].map(status => (
                      <button
                        key={status}
                        onClick={() => toggleStatus(status)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer capitalize ${
                          selectedStatuses.includes(status)
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full py-2.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function mapInstance() {
  return document.querySelector('.maplibregl-map')?._map || null;
}

function statusColor(status) {
  switch (status) {
    case 'open': return '#f59e0b';
    case 'assigned': return '#3b82f6';
    case 'resolved': return '#10b981';
    default: return '#64748b';
  }
}
