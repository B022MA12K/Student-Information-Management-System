import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="state" role="status">
      <ArrowPathIcon className="icon-xl spin" />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state state-error" role="alert">
      <ExclamationTriangleIcon className="icon-xl" />
      <h2>Could not load this page</h2>
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          <ArrowPathIcon className="icon" />
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="state">
      <Icon className="icon-xl" />
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}
