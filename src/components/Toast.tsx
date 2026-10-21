import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAuth();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start p-3.5 rounded-xl border text-xs transition-all shadow-md ${
            toast.type === 'success'
              ? 'bg-[#18392B] text-[#FAF9F6] border-[#10261D]'
              : toast.type === 'error'
              ? 'bg-[#FAF2EE] text-[#202820] border-[#F0D5C9]'
              : 'bg-[#202820] text-[#FAF9F6] border-[#364036]'
          }`}
        >
          <div className="mr-2.5 shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#A8B8A0]" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-[#C77755]" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-[#A8B8A0]" />}
          </div>
          <div className="flex-1 pr-2">
            <h4 className="font-medium text-xs">{toast.title}</h4>
            {toast.message && (
              <p className={`mt-0.5 leading-relaxed text-[11px] ${
                toast.type === 'error' ? 'text-[#72766F]' : 'text-[#FAF9F6]/80'
              }`}>
                {toast.message}
              </p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-[#72766F] hover:text-[#202820] transition-colors p-0.5"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
