import React, { useEffect, useRef, useState } from 'react';

export default function SocialLogin({ onCredential, isLoading, label = 'or continue with' }) {
  const initialized = useRef(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      initialized.current = true;
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onerror = () => setLoadError('Failed to load Google Sign-In');
    document.body.appendChild(script);
  }, []);

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setLoadError('Google Client ID is not configured');
      return;
    }

    if (!window.google) {
      setLoadError('Google Sign-In is still loading. Please try again.');
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.access_token) {
          onCredential(response.access_token);
        } else if (response.error) {
          setLoadError(response.error_description || 'Google sign-in was cancelled');
        }
      },
      error_callback: (error) => {
        setLoadError(error.message || 'Google sign-in failed');
      },
    });

    client.requestAccessToken();
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {loadError && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
          {loadError}
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold rounded-lg transition-all text-sm flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>
    </div>
  );
}
