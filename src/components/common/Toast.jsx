import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

let toastId = 0;

export const toast = {
  success: (message, duration = 4000) => {
    window.dispatchEvent(
      new CustomEvent('app-toast', {
        detail: { id: ++toastId, message, type: 'success', duration }
      })
    );
  },
  error: (message, duration = 5000) => {
    window.dispatchEvent(
      new CustomEvent('app-toast', {
        detail: { id: ++toastId, message, type: 'error', duration }
      })
    );
  },
  warning: (message, duration = 4500) => {
    window.dispatchEvent(
      new CustomEvent('app-toast', {
        detail: { id: ++toastId, message, type: 'warning', duration }
      })
    );
  },
  info: (message, duration = 4000) => {
    window.dispatchEvent(
      new CustomEvent('app-toast', {
        detail: { id: ++toastId, message, type: 'info', duration }
      })
    );
  }
};

const TOAST_STYLES = {
  success: {
    bg: 'bg-emerald-900/95 border-emerald-500/40 text-emerald-100',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    title: 'Success'
  },
  error: {
    bg: 'bg-rose-950/95 border-rose-500/50 text-rose-100',
    icon: AlertCircle,
    iconColor: 'text-rose-400',
    title: 'Permission Denied / Error'
  },
  warning: {
    bg: 'bg-amber-950/95 border-amber-500/40 text-amber-100',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    title: 'Warning'
  },
  info: {
    bg: 'bg-blue-950/95 border-blue-500/40 text-blue-100',
    icon: Info,
    iconColor: 'text-blue-400',
    title: 'Notice'
  }
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const newToast = e.detail;
      setToasts((prev) => [...prev, newToast]);

      if (newToast.duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, newToast.duration);
      }
    };

    window.addEventListener('app-toast', handleToast);
    return () => window.removeEventListener('app-toast', handleToast);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((item) => {
        const style = TOAST_STYLES[item.type] || TOAST_STYLES.info;
        const Icon = style.icon;

        return (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-top-3 ${style.bg}`}
            role="alert"
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${style.iconColor}`} />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-80 leading-none">
                {style.title}
              </div>
              <div className="text-xs font-medium mt-1 leading-snug break-words">
                {item.message}
              </div>
            </div>
            <button
              onClick={() => removeToast(item.id)}
              className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
