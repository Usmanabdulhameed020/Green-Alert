import { useState, useRef, useEffect } from 'react';
import { Search, Crosshair, Sun, Moon, Loader } from 'lucide-react';

export function MapSearchBar({ mapRef, onResult }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&accept-language=en`
        );
        const data = await res.json();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelect = (item) => {
    const lng = parseFloat(item.lon);
    const lat = parseFloat(item.lat);
    setQuery(item.display_name.split(',')[0]);
    setSuggestions([]);
    setFocused(false);
    if (onResult) onResult(lng, lat);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (suggestions.length > 0) handleSelect(suggestions[0]);
  };

  return (
    <div className="relative w-full max-w-sm z-20">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="Search location..."
          className="w-full bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400"
        />
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        {searching && <Loader className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 animate-spin" />}
      </form>
      {focused && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-60 overflow-y-auto">
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onMouseDown={() => handleSelect(item)}
              className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors border-b border-slate-100 last:border-b-0 cursor-pointer"
            >
              <span className="line-clamp-1">{item.display_name}</span>
              <span className="text-[9px] text-slate-400 mt-0.5 block">{item.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function LocateMeButton({ mapRef, onLocated }) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (onLocated) onLocated(longitude, latitude);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) setError('Location access denied');
        else if (err.code === 2) setError('Location unavailable');
        else setError('Failed to get location');
        setTimeout(() => setError(null), 3000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="relative">
      <button
        onClick={handleLocate}
        disabled={locating}
        className="w-9 h-9 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-60"
        title="Locate Me"
      >
        {locating ? (
          <Loader className="h-4 w-4 text-emerald-600 animate-spin" />
        ) : (
          <Crosshair className="h-4 w-4 text-slate-600" />
        )}
      </button>
      {error && (
        <div className="absolute right-0 top-full mt-1 bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5 text-[10px] font-semibold text-rose-600 whitespace-nowrap shadow-lg z-30">
          {error}
        </div>
      )}
    </div>
  );
}

export function MapThemeToggle() {
  return null;
}

export function FullscreenToggle() {
  const handleToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="w-9 h-9 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer"
      title="Fullscreen"
    >
      <svg className="h-4 w-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15 3 21 3 21 9" />
        <polyline points="9 21 3 21 3 15" />
        <line x1="21" y1="3" x2="14" y2="10" />
        <line x1="3" y1="21" x2="10" y2="14" />
      </svg>
    </button>
  );
}
