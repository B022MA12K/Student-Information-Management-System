import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AcademicCapIcon, CheckCircleIcon, ClockIcon, PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Avatar from '../components/Avatar.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { EmptyState, ErrorState, Loading } from '../components/States.jsx';
import { formatDate, yearLabel } from '../utils.js';

const SEGMENTS = [
  { key: 'active', label: 'Active', icon: CheckCircleIcon },
  { key: 'inactive', label: 'Inactive', icon: ClockIcon },
  { key: 'graduated', label: 'Graduated', icon: AcademicCapIcon },
];

function BarList({ rows }) {
  const max = Math.max(...rows.map((r) => r.total), 1);
  return (
    <ul className="bars">
      {rows.map((r) => (
        <li key={r.label} className="bar-row">
          <span>{r.label}</span>
          <span className="bar-track"><span className="bar-fill" style={{ width: `${(r.total / max) * 100}%` }} /></span>
          <span className="tnum">{r.total}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    setState({ loading: true, error: null, data: null });
    api
      .summary()
      .then((data) => !ignore && setState({ loading: false, error: null, data }))
      .catch((err) => !ignore && setState({ loading: false, error: err.message, data: null }));
    return () => { ignore = true; };
  }, [reloadKey]);

  const header = (
    <PageHeader title="Dashboard" subtitle={`Welcome back, ${user.fullName.split(' ')[0]}.`}>
      <Link className="btn btn-primary" to="/students/new">
        <PlusIcon className="icon" />
        Add student
      </Link>
    </PageHeader>
  );

  if (state.loading) return <>{header}<Loading label="Loading the summary…" /></>;
  if (state.error) return <>{header}<ErrorState message={state.error} onRetry={() => setReloadKey((k) => k + 1)} /></>;

  const { totals, byCourse, byYear, recent } = state.data;

  if (totals.total === 0) {
    return (
      <>
        {header}
        <section className="panel">
          <EmptyState
            icon={UserGroupIcon}
            title="No students yet"
            text="Add the first student record to start the summary."
            action={<Link className="btn btn-primary" to="/students/new"><PlusIcon className="icon" />Add student</Link>}
          />
        </section>
      </>
    );
  }

  return (
    <>
      {header}

      <section className="panel panel-pad">
        <h2>{totals.total} {totals.total === 1 ? 'student' : 'students'} on record</h2>
        <div
          className="statusbar"
          role="img"
          aria-label={SEGMENTS.map((s) => `${totals[s.key]} ${s.label.toLowerCase()}`).join(', ')}
        >
          {SEGMENTS.map((s) => totals[s.key] > 0 && <span key={s.key} className={`seg seg-${s.key}`} style={{ flexGrow: totals[s.key] }} />)}
        </div>
        <ul className="legend">
          {SEGMENTS.map(({ key, label, icon: Icon }) => (
            <li key={key}>
              <Icon className={`icon seg-icon seg-icon-${key}`} />
              {label} <strong className="tnum">{totals[key]}</strong>
            </li>
          ))}
        </ul>
      </section>

      <div className="split">
        <section className="panel panel-pad">
          <h2>Students by course</h2>
          <BarList rows={byCourse} />
        </section>
        <section className="panel panel-pad">
          <h2>Students by year level</h2>
          <BarList rows={byYear.map((r) => ({ label: yearLabel(r.year_level), total: r.total }))} />
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Recently added</h2>
          <Link to="/students">View all records</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Student</th><th>Student ID</th><th>Course</th><th>Status</th><th>Added</th></tr>
            </thead>
            <tbody>
              {recent.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="person">
                      <Avatar src={s.photo_url} name={s.name} size="md" />
                      <Link to={`/students/${s.id}`}>{s.name}</Link>
                    </div>
                  </td>
                  <td className="tnum">{s.student_id}</td>
                  <td>{s.course || 'Not set'}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td>{formatDate(s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
