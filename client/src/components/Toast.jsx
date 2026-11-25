import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const notify = useCallback(
    (message, type = 'success') => {
      const id = nextId++;
      setToasts((list) => [...list, { id, message, type }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = t.type === 'success' ? CheckCircleIcon : ExclamationCircleIcon;
          return (
            <div key={t.id} className={`toast toast-${t.type}`}>
              <Icon className="icon" />
              <span>{t.message}</span>
              <button className="icon-btn small" aria-label="Dismiss message" onClick={() => dismiss(t.id)}>
                <XMarkIcon className="icon" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
