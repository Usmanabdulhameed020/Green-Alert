import { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, Check, Globe, Map } from 'lucide-react';
import { AOShadowLayer } from './ao-shadow.mjs';

/* ─── Multi-Source Satellite Map Tile Definitions ───────────────── */
const ESRI_SATELLITE_STYLE = {
  version: 8,
  name: 'esri-satellite',
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.esri.com">Esri</a>, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN',
      maxzoom: 19,
    },
    'esri-transportation': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
    },
    'esri-labels': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 19,
    },
    {
      id: 'esri-transportation-layer',
      type: 'raster',
      source: 'esri-transportation',
      minzoom: 0,
      maxzoom: 19,
      paint: { 'raster-opacity': 0.6 },
    },
    {
      id: 'esri-labels-layer',
      type: 'raster',
      source: 'esri-labels',
      minzoom: 0,
      maxzoom: 19,
      paint: { 'raster-opacity': 0.85 },
    },
  ],
};

const GOOGLE_PURE_SATELLITE_STYLE = {
  version: 8,
  name: 'google-pure-satellite',
  sources: {
    'google-sat': {
      type: 'raster',
      tiles: [
        'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      ],
      tileSize: 256,
      attribution: '&copy; Google Maps',
      maxzoom: 21,
    },
  },
  layers: [
    {
      id: 'google-sat-layer',
      type: 'raster',
      source: 'google-sat',
      minzoom: 0,
      maxzoom: 21,
    },
  ],
};

const GOOGLE_HYBRID_STYLE = {
  version: 8,
  name: 'google-hybrid',
  sources: {
    'google-hybrid': {
      type: 'raster',
      tiles: [
        'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      ],
      tileSize: 256,
      attribution: '&copy; Google Maps',
      maxzoom: 21,
    },
  },
  layers: [
    {
      id: 'google-hybrid-layer',
      type: 'raster',
      source: 'google-hybrid',
      minzoom: 0,
      maxzoom: 21,
    },
  ],
};

const SATELLITE_PROVIDERS = [
  { id: 'esri',          name: 'Esri Satellite',              badge: 'HD Aerial',     style: ESRI_SATELLITE_STYLE },
  { id: 'google_sat',    name: 'Google Pure Satellite',        badge: 'Zoom up to 21', style: GOOGLE_PURE_SATELLITE_STYLE },
  { id: 'google_hybrid', name: 'Google Hybrid (With Labels)', badge: 'Zoom up to 21', style: GOOGLE_HYBRID_STYLE },
];

const DEFAULT_CENTER = [3.3792, 6.5244];
const DEFAULT_ZOOM = 12;

const LAYER_IDS = {
  CLUSTERS: 'clusters',
  CLUSTER_COUNT: 'cluster-count',
  UNCLUSTERED: 'unclustered-point',
};

export default function MapLibreMap({
  mapRef: externalMapRef,
  style = 'light',
  center: centerProp,
  zoom: zoomProp,
  interactive = true,
  markers = [],
  onClick,
  onMarkerClick,
  fitBoundsToMarkers = false,
  clusterMarkers = false,
  showControls = true,
  static: isStatic = false,
  className = '',
  children,
}) {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [activeProvider, setActiveProvider] = useState('esri');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const markersRef = useRef([]);
  const popupRef = useRef(null);

  const center = centerProp || DEFAULT_CENTER;
  const zoom = zoomProp || DEFAULT_ZOOM;

  // Pass map instance to parent
  useEffect(() => {
    if (externalMapRef) externalMapRef.current = mapInstanceRef.current;
  }, [mapLoaded, externalMapRef]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return;
    setMapError(null);

    const initialStyleObj = SATELLITE_PROVIDERS.find((p) => p.id === activeProvider)?.style || ESRI_SATELLITE_STYLE;

    try {
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: initialStyleObj,
        center,
        zoom,
        maxPitch: 85,
        attributionControl: true,
        interactive: interactive && !isStatic,
      });

      map.on('load', () => {
        mapInstanceRef.current = map;
        setMapLoaded(true);
        setTimeout(() => { map.resize(); }, 150);
      });

      map.on('error', (e) => {
        console.warn('MapLibre warning:', e?.error?.message || e);
      });

      if (isStatic || !interactive) {
        map.dragPan.disable();
        map.scrollZoom.disable();
        map.boxZoom.disable();
        map.dragRotate.disable();
        map.keyboard.disable();
        map.doubleClickZoom.disable();
        map.touchZoomRotate.disable();
      }

      if (showControls && interactive) {
        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        map.addControl(new maplibregl.ScaleControl(), 'bottom-left');
      }

      if (onClick) {
        map.on('click', (e) => onClick({ lng: e.lngLat.lng, lat: e.lngLat.lat }));
      }

      return () => {
        map.remove();
        mapInstanceRef.current = null;
        setMapLoaded(false);
      };
    } catch (err) {
      setMapError(err.message || 'Failed to initialize map');
    }
  }, []);

  // Change Satellite Provider Layer
  const handleSwitchProvider = (providerId) => {
    const map = mapInstanceRef.current;
    if (!map || providerId === activeProvider) return;
    const selected = SATELLITE_PROVIDERS.find((p) => p.id === providerId);
    if (!selected) return;

    setActiveProvider(providerId);
    setShowLayerMenu(false);

    map.setStyle(selected.style);
    map.once('style.load', () => {
      if (isStatic || !interactive) {
        map.dragPan.disable();
        map.scrollZoom.disable();
        map.doubleClickZoom.disable();
      }
    });
  };

  // Update center/zoom
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;
    if (isStatic || fitBoundsToMarkers) return;
    map.flyTo({ center, zoom, duration: 800 });
  }, [centerProp?.[0], centerProp?.[1], zoomProp]);

  // Manage markers with clustering
  const updateMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    const sourceId = 'map-markers-source';
    if (map.getSource(sourceId)) {
      Object.values(LAYER_IDS).forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      map.removeSource(sourceId);
    }

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!markers.length) return;

    const features = markers.filter((m) => m.lng != null && m.lat != null).map((m) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [m.lng, m.lat] },
      properties: { id: m.id, popupHtml: m.popupHtml || '', color: m.color || '#10b981' },
    }));

    if (!features.length) return;

    if (fitBoundsToMarkers && !isStatic) {
      const bounds = features.reduce((b, f) => {
        const [lng, lat] = f.geometry.coordinates;
        return b.extend([lng, lat]);
      }, new maplibregl.LngLatBounds(features[0].geometry.coordinates, features[0].geometry.coordinates));
      map.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 800 });
    }

    if (clusterMarkers && features.length > 3) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      map.addLayer({
        id: LAYER_IDS.CLUSTERS,
        type: 'circle',
        source: sourceId,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#059669',
          'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 50, 40],
          'circle-opacity': 0.85,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff',
        },
      });

      map.addLayer({
        id: LAYER_IDS.CLUSTER_COUNT,
        type: 'symbol',
        source: sourceId,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: { 'text-color': '#ffffff' },
      });

      map.addLayer({
        id: LAYER_IDS.UNCLUSTERED,
        type: 'circle',
        source: sourceId,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 8,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.9,
        },
      });

      map.on('click', LAYER_IDS.CLUSTERS, (e) => {
        const f = e.features[0];
        const clusterId = f.properties.cluster_id;
        const source = map.getSource(sourceId);
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.flyTo({ center: f.geometry.coordinates, zoom: zoom + 1, duration: 600 });
        });
      });

      map.on('click', LAYER_IDS.UNCLUSTERED, (e) => {
        const f = e.features[0];
        const coords = f.geometry.coordinates.slice();
        const popupHtml = f.properties.popupHtml;

        if (popupRef.current) popupRef.current.remove();

        if (popupHtml) {
          popupRef.current = new maplibregl.Popup({ offset: 25, maxWidth: '280px', closeButton: true })
            .setLngLat(coords)
            .setHTML(popupHtml)
            .addTo(map);
        }

        if (onMarkerClick && f.properties.id) onMarkerClick(f.properties.id);
      });

      map.on('mouseenter', LAYER_IDS.CLUSTERS, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', LAYER_IDS.CLUSTERS, () => { map.getCanvas().style.cursor = ''; });
      map.on('mouseenter', LAYER_IDS.UNCLUSTERED, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', LAYER_IDS.UNCLUSTERED, () => { map.getCanvas().style.cursor = ''; });
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
      });

      map.addLayer({
        id: LAYER_IDS.UNCLUSTERED,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 8,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.9,
        },
      });

      map.on('click', LAYER_IDS.UNCLUSTERED, (e) => {
        const f = e.features[0];
        const coords = f.geometry.coordinates.slice();
        const popupHtml = f.properties.popupHtml;

        if (popupRef.current) popupRef.current.remove();

        if (popupHtml) {
          popupRef.current = new maplibregl.Popup({ offset: 25, maxWidth: '280px', closeButton: true })
            .setLngLat(coords)
            .setHTML(popupHtml)
            .addTo(map);
        }

        if (onMarkerClick && f.properties.id) onMarkerClick(f.properties.id);
      });

      map.on('mouseenter', LAYER_IDS.UNCLUSTERED, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', LAYER_IDS.UNCLUSTERED, () => { map.getCanvas().style.cursor = ''; });
    }
  }, [markers, mapLoaded, clusterMarkers, fitBoundsToMarkers, isStatic, onMarkerClick, activeProvider]);

  useEffect(() => {
    if (!mapLoaded) return;
    const timer = setTimeout(updateMarkers, 100);
    return () => clearTimeout(timer);
  }, [updateMarkers, mapLoaded]);

  if (mapError) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 rounded-2xl ${className}`} style={{ minHeight: 300 }}>
        <div className="text-center p-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-amber-600 text-xl font-bold">!</span>
          </div>
          <p className="text-sm font-bold text-slate-700">Failed to load map</p>
          <p className="text-xs text-slate-500 mt-1">{mapError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl w-full h-full min-h-[400px] ${className}`}>
      <div ref={containerRef} className="w-full h-full min-h-[400px]" />

      {/* Multi-Source Satellite Layer Control Switcher */}
      {showControls && interactive && (
        <div className="absolute top-16 left-4 z-20">
          <div className="relative">
            <button
              onClick={() => setShowLayerMenu((prev) => !prev)}
              className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl shadow-lg border border-slate-700/80 backdrop-blur-md transition-all cursor-pointer"
              title="Switch Satellite Map Source"
            >
              <Layers className="h-4 w-4 text-emerald-400" />
              <span>{SATELLITE_PROVIDERS.find((p) => p.id === activeProvider)?.name || 'Satellite Feeds'}</span>
            </button>

            {showLayerMenu && (
              <div className="absolute top-11 left-0 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 p-2.5 space-y-1.5 z-30">
                <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Select Satellite Tile Feed
                </div>
                {SATELLITE_PROVIDERS.map((provider) => {
                  const isSelected = activeProvider === provider.id;
                  return (
                    <button
                      key={provider.id}
                      onClick={() => handleSwitchProvider(provider.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200 shadow-sm'
                          : 'hover:bg-slate-100/80 text-slate-700 font-semibold'
                      }`}
                    >
                      <div>
                        <p className="text-xs">{provider.name}</p>
                        <span className="text-[9px] text-slate-400 font-medium">{provider.badge}</span>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Loading satellite map...</p>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
