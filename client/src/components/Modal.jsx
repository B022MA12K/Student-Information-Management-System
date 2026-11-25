import { useEffect } from 'react';

export default function Modal({ title, icon: Icon, tone = 'info', busy = false, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  return (
    <div
      className="backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <span className={`modal-icon tone-${tone}`}>
          <Icon className="icon-lg" />
        </span>
        <h2 id="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
