import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AcademicCapIcon, BriefcaseIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../auth.jsx';
import AuthShell from '../components/AuthShell.jsx';
import Field from '../components/Field.jsx';
import PasswordInput from '../components/PasswordInput.jsx';

const ROLES = [
  { value: 'student', icon: AcademicCapIcon, label: 'Student', text: 'See your own record' },
  { value: 'staff', icon: BriefcaseIcon, label: 'Staff', text: 'Add, edit and search records' },
];

export default function Register() {
  const { user, register } = useAuth();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ full_name: '', username: '', password: '', student_id: '', email: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (name) => (e) => {
    setForm((f) => ({ ...f, [name]: e.target.value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    const found = {};
    if (role === 'staff' && !form.full_name.trim()) found.full_name = 'Full name is required';
    if (role === 'student') {
      if (!form.student_id.trim()) found.student_id = 'Student ID is required';
      if (!form.email.trim()) found.email = 'Email is required';
    }
    if (!form.username.trim()) found.username = 'Username is required';
    if (form.password.length < 8) found.password = 'Use at least 8 characters';
    if (Object.keys(found).length) return setErrors(found);

    setBusy(true);
    setFormError('');
    try {
      await register({ ...form, role });
    } catch (err) {
      if (err.errors && Object.keys(err.errors).length) setErrors(err.errors);
      else setFormError(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Create an account"
      footer={<>Already registered? <Link to="/login">Log in</Link></>}
    >
      <form onSubmit={onSubmit} noValidate>
        {formError && (
          <p className="form-error" role="alert">
            <ExclamationCircleIcon className="icon" />
            {formError}
          </p>
        )}

        <fieldset className="choice">
          <legend>Sign up as</legend>
          {ROLES.map(({ value, icon: Icon, label, text }) => (
            <label key={value} className={`choice-item${role === value ? ' selected' : ''}`}>
              <input
                className="sr-only"
                type="radio"
                name="role"
                value={value}
                checked={role === value}
                onChange={() => { setRole(value); setErrors({}); }}
              />
              <Icon className="icon-lg" />
              <span>
                <strong>{label}</strong>
                <small>{text}</small>
              </span>
            </label>
          ))}
        </fieldset>

        {role === 'staff' ? (
          <Field label="Full name" htmlFor="full_name" error={errors.full_name} required>
            <input id="full_name" type="text" value={form.full_name} onChange={set('full_name')} autoComplete="name" aria-invalid={Boolean(errors.full_name) || undefined} />
          </Field>
        ) : (
          <>
            <Field label="Student ID" htmlFor="student_id" error={errors.student_id} required hint="The ID on your student record, for example 2026-001.">
              <input id="student_id" type="text" value={form.student_id} onChange={set('student_id')} aria-invalid={Boolean(errors.student_id) || undefined} />
            </Field>
            <Field label="Email on file" htmlFor="email" error={errors.email} required hint="Use the email address the school has for you.">
              <input id="email" type="email" value={form.email} onChange={set('email')} autoComplete="email" aria-invalid={Boolean(errors.email) || undefined} />
            </Field>
          </>
        )}

        <Field label="Username" htmlFor="username" error={errors.username} required>
          <input id="username" type="text" value={form.username} onChange={set('username')} autoComplete="username" aria-invalid={Boolean(errors.username) || undefined} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password} required hint="At least 8 characters.">
          <PasswordInput id="password" value={form.password} onChange={set('password')} autoComplete="new-password" invalid={Boolean(errors.password)} />
        </Field>

        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
