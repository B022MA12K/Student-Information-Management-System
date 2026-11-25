import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Avatar from '../components/Avatar.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { EmptyState, ErrorState, Loading } from '../components/States.jsx';
import { useToast } from '../components/Toast.jsx';
import { STATUSES, yearLabel } from '../utils.js';

const PAGE_SIZE = 10;

export default function Students() {
  const { user } = useAuth();
  const { notify } = useToast();

  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ loading: true, error: null, rows: [], total: 0 });
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Wait until typing pauses before asking the server.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let ignore = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .listStudents({ q, status, page, limit: PAGE_SIZE })
      .then((res) => !ignore && setState({ loading: false, error: null, rows: res.data, total: res.total }))
      .catch((err) => !ignore && setState((s) => ({ ...s, loading: false, error: err.message })));
    return () => { ignore = true; };
  }, [q, status, page, reloadKey]);

  async function confirmDelete() {
    setDeleting(true);
    try {
      await api.deleteStudent(toDelete.id);
      notify(`${toDelete.name} was deleted`);
      setToDelete(null);
      if (state.rows.length === 1 && page > 1) setPage((p) => p - 1);
      else setReloadKey((k) => k + 1);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  }

  const { loading, error, rows, total } = state;
  const filtered = Boolean(q || status);
  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  let body;
  if (error) {
    body = <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />;
  } else if (loading && rows.length === 0) {
    body = <Loading label="Loading students…" />;
  } else if (rows.length === 0) {
    body = filtered ? (
      <EmptyState
        icon={MagnifyingGlassIcon}
        title="No matching students"
        text="Try a different name, ID or status."
        action={<button className="btn btn-secondary" onClick={() => { setSearch(''); setQ(''); setStatus(''); setPage(1); }}>Clear search</button>}
      />
    ) : (
      <EmptyState
        icon={UserGroupIcon}
        title="No students yet"
        text="Add the first student record."
        action={<Link className="btn btn-primary" to="/students/new"><PlusIcon className="icon" />Add student</Link>}
      />
    );
  } else {
    body = (
      <>
        <div className="table-wrap" aria-busy={loading}>
          <table className={loading ? 'is-loading' : undefined}>
            <caption className="sr-only">Student records</caption>
            <thead>
              <tr>
                <th>Student</th>
                <th>Student ID</th>
                <th>Course</th>
                <th>Year level</th>
                <th>Status</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="person">
                      <Avatar src={s.photo_url} name={s.name} size="md" />
                      <div>
                        <strong>{s.name}</strong>
                        <small>{s.email}</small>
                      </div>
                    </div>
                  </td>
                  <td className="tnum">{s.student_id}</td>
                  <td>{s.course || 'Not set'}</td>
                  <td>{yearLabel(s.year_level)}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td>
                    <div className="actions">
                      <Link className="icon-btn" to={`/students/${s.id}`} aria-label={`View ${s.name}`} title="View">
                        <EyeIcon className="icon" />
                      </Link>
                      <Link className="icon-btn" to={`/students/${s.id}/edit`} aria-label={`Edit ${s.name}`} title="Edit">
                        <PencilSquareIcon className="icon" />
                      </Link>
                      {user.role === 'admin' && (
                        <button className="icon-btn danger" aria-label={`Delete ${s.name}`} title="Delete" onClick={() => setToDelete(s)}>
                          <TrashIcon className="icon" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pager">
          <span className="tnum">Showing {from} to {to} of {total}</span>
          <div className="pager-buttons">
            <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeftIcon className="icon" />
              Previous
            </button>
            <button className="btn btn-secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              Next
              <ChevronRightIcon className="icon" />
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Student records" subtitle="Search, open and update student information.">
        <Link className="btn btn-primary" to="/students/new">
          <PlusIcon className="icon" />
          Add student
        </Link>
      </PageHeader>

      <section className="panel">
        <div className="toolbar">
          <div className="search">
            <MagnifyingGlassIcon className="icon" />
            <input
              type="search"
              aria-label="Search students"
              placeholder="Search by name, student ID, email or course"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {body}
      </section>

      {toDelete && (
        <ConfirmDialog
          title={`Delete ${toDelete.name}?`}
          message="This removes the student record and photo. The student's account, if any, stays but loses its link. This cannot be undone."
          confirmLabel="Delete student"
          busyLabel="Deleting…"
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}
