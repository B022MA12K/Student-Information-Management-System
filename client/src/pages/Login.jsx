import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../auth.jsx';
import AuthShell from '../components/AuthShell.jsx';
import Field from '../components/Field.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.username.trim() || !form.password) {
      setError('Enter your username and password');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await login(form.username.trim(), form.password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Log in"
      subtitle="Use the account you created for this system."
      footer={<>No account yet? <Link to="/register">Create an account</Link></>}
    >
      <form onSubmit={onSubmit} noValidate>
        {error && (
          <p className="form-error" role="alert">
            <ExclamationCircleIcon className="icon" />
            {error}
          </p>
        )}
        <Field label="Username" htmlFor="username">
          <input id="username" type="text" value={form.username} onChange={set('username')} autoComplete="username" autoFocus />
        </Field>
        <Field label="Password" htmlFor="password" hint="Forgot your password? Ask the administrator to reset it.">
          <PasswordInput id="password" value={form.password} onChange={set('password')} autoComplete="current-password" />
        </Field>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthShell>
  );
}
