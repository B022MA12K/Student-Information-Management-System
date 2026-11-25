import { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function PasswordInput({ id, value, onChange, autoComplete, invalid, autoFocus }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        aria-invalid={invalid || undefined}
      />
      <button
        type="button"
        className="icon-btn"
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        onClick={() => setShow((s) => !s)}
      >
        {show ? <EyeSlashIcon className="icon" /> : <EyeIcon className="icon" />}
      </button>
    </div>
  );
}
