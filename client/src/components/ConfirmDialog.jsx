import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Modal from './Modal.jsx';

export default function ConfirmDialog({ title, message, confirmLabel, busyLabel, busy, onConfirm, onCancel }) {
  return (
    <Modal title={title} icon={ExclamationTriangleIcon} tone="danger" busy={busy} onClose={onCancel}>
      <p>{message}</p>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={onCancel} disabled={busy} autoFocus>
          Cancel
        </button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
