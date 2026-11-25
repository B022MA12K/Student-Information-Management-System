import { useEffect, useState } from 'react';
import { KeyIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { api } from '../api.js';
import Field from '../components/Field.jsx';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import { ErrorState, Loading } from '../components/States.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatDate, ROLE_LABELS } from '../utils.js';

function ResetDialog({ account, onClose, onDone }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (password.length < 8) return setError('Use at least 8 characters');
    setBusy(true);
    try {
      await api.resetPassword(account.id, password);
      onDone(account);
    } catch (err) {
      setError(err.errors?.password || err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={`Reset password for ${account.full_name}`} icon={KeyIcon} busy={busy} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate>
        <p>Set a new password, then give it to the account owner.</p>
        <Field label="New password" htmlFor="new-password" error={error} hint="At least 8 characters.">
          <PasswordInput id="new-password" value={password} autoComplete="new-password" invalid={Boolean(error)} autoFocus
            onChange={(e) => { setPassword(e.target.value); setError(''); }} />
        </Field>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save password'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Accounts() {
  const { notify } = useToast();
  const [state, setState] = useState({ loading: true, error: null, rows: [] });
  const [reloadKey, setReloadKey] = useState(0);
  const [target, setTarget] = useState(null);

  useEffect(() => {
    let ignore = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .listUsers()
      .then((rows) => !ignore && setState({ loading: false, error: null, rows }))
      .catch((err) => !ignore && setState({ loading: false, error: err.message, rows: [] }));
    return () => { ignore = true; };
  }, [reloadKey]);

  const { loading, error, rows } = state;

  return (
    <>
      <PageHeader title="Accounts" subtitle="People who can log in. Reset a password when someone forgets it." />
      <section className="panel">
        {error ? (
          <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        ) : loading ? (
          <Loading label="Loading accounts…" />
        ) : (
          <div className="table-wrap">
            <table>
              <caption className="sr-only">Accounts</caption>
              <thead>
                <tr><th>Name</th><th>Username</th><th>Role</th><th>Student ID</th><th>Created</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.full_name}</strong></td>
                    <td>{a.username}</td>
                    <td>
                      <span className={`badge ${a.role === 'admin' ? 'badge-info' : 'badge-plain'}`}>
                        {a.role === 'admin' && <ShieldCheckIcon className="icon-sm" />}
                        {ROLE_LABELS[a.role]}
                      </span>
                    </td>
                    <td className="tnum">{a.student_id || 'Not linked'}</td>
                    <td>{formatDate(a.created_at)}</td>
                    <td>
                      <div className="actions">
                        <button className="icon-btn" aria-label={`Reset password for ${a.full_name}`} title="Reset password" onClick={() => setTarget(a)}>
                          <KeyIcon className="icon" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {target && (
        <ResetDialog
          account={target}
          onClose={() => setTarget(null)}
          onDone={(a) => { notify(`Password changed for ${a.full_name}`); setTarget(null); }}
        />
      )}
    </>
  );
}
