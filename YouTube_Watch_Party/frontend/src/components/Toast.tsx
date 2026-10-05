import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'error' | 'success' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
      }}
    >
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';

        return (
          <div
            key={toast.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: isError
                ? 'rgba(38, 14, 20, 0.95)'
                : isSuccess
                ? 'rgba(12, 38, 28, 0.95)'
                : 'rgba(20, 26, 44, 0.95)',
              border: `1px solid ${
                isError ? '#f43f5e' : isSuccess ? '#10b981' : '#6366f1'
              }`,
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              color: '#fff',
              fontSize: '0.9rem',
              animation: 'fadeIn 0.25s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isError && <AlertCircle size={18} color="#f43f5e" />}
              {isSuccess && <CheckCircle size={18} color="#10b981" />}
              {!isError && !isSuccess && <Info size={18} color="#6366f1" />}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                display: 'flex',
                padding: '2px',
              }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
