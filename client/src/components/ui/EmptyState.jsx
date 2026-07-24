import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EmptyState({
  icon: Icon = FileText,
  title = 'Nothing here yet',
  description = '',
  actionLabel,
  actionPath,
  onAction,
}) {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionPath) {
      navigate(actionPath);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200/50 flex items-center justify-center mb-5 shadow-sm">
        <Icon className="w-8 h-8 text-emerald-600" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      {description && (
        <p className="text-slate-500 text-sm max-w-sm mb-6 leading-relaxed">{description}</p>
      )}
      {actionLabel && (
        <button
          onClick={handleAction}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-emerald-600/10 active:scale-98 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
