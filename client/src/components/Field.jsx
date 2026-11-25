import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

// Label above the input, error next to the field.
export default function Field({ label, htmlFor, error, hint, required, children }) {
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={htmlFor}>
        {label}
        {required && <span className="req" aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="hint">{hint}</p>}
      {error && (
        <p className="error-text" role="alert">
          <ExclamationCircleIcon className="icon-sm" />
          {error}
        </p>
      )}
    </div>
  );
}
