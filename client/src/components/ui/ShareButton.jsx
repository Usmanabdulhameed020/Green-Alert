import { useState } from 'react';
import { Share2, Link2, Copy, Check, Mail, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShareButton({ reportId, reportTitle }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/reports/${reportId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: copied ? Check : (copied ? Check : Link2),
      action: copyLink,
      color: copied ? 'text-emerald-500' : 'text-slate-500',
    },
    {
      name: 'Twitter',
      icon: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-sky-500">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(reportTitle)}&url=${encodeURIComponent(shareUrl)}`, '_blank'),
      color: 'text-sky-500',
    },
    {
      name: 'Facebook',
      icon: () => (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-600">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank'),
      color: 'text-blue-600',
    },
    {
      name: 'Email',
      icon: Mail,
      action: () => window.location.href = `mailto:?subject=${encodeURIComponent(`GreenAlert Report: ${reportTitle}`)}&body=${encodeURIComponent(`Check out this report: ${shareUrl}`)}`,
      color: 'text-slate-500',
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <Share2 size={16} />
        <span>Share</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-2 min-w-[180px]"
            >
              {shareOptions.map((opt) => (
                <button
                  key={opt.name}
                  onClick={() => { opt.action(); if (opt.name !== 'Copy Link') setIsOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <opt.icon size={16} className={opt.color} />
                  {opt.name === 'Copy Link' && copied ? 'Copied!' : opt.name}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
