import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AcademicCapIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ClockIcon,
  EnvelopeIcon,
  IdentificationIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Avatar from '../components/Avatar.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { ErrorState, Loading } from '../components/States.jsx';
import { formatDate, yearLabel } from '../utils.js';

function Row({ icon: Icon, label, children }) {
  return (
    <div className="row">
      <dt><Icon className="icon" />{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default function StudentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isStaff = user.role !== 'student';
  const [state, setState] = useState({ loading: true, error: null, student: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    setState({ loading: true, error: null, student: null });
    api
      .getStudent(id)
      .then((student) => !ignore && setState({ loading: false, error: null, student }))
      .catch((err) => !ignore && setState({ loading: false, error: err.message, student: null }));
    return () => { ignore = true; };
  }, [id, reloadKey]);

  const { loading, error, student: s } = state;
  if (loading) return <Loading label="Loading the record…" />;
  if (error) return <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />;

  return (
    <>
      <PageHeader title={isStaff ? 'Student record' : 'My record'} subtitle={isStaff ? undefined : 'This is the information the school has on file for you.'}>
        {isStaff && (
          <>
            <Link className="btn btn-secondary" to="/students">
              <ArrowLeftIcon className="icon" />
              All records
            </Link>
            <Link className="btn btn-primary" to={`/students/${s.id}/edit`}>
              <PencilSquareIcon className="icon" />
              Edit
            </Link>
          </>
        )}
      </PageHeader>

      <article className="panel sheet">
        <Avatar src={s.photo_url} name={s.name} size="portrait" />
        <div>
          <div className="sheet-name">
            <h2>{s.name}</h2>
            <StatusBadge status={s.status} />
          </div>
          <dl className="rows">
            <Row icon={IdentificationIcon} label="Student ID"><span className="tnum">{s.student_id}</span></Row>
            <Row icon={EnvelopeIcon} label="Email">{s.email}</Row>
            <Row icon={BookOpenIcon} label="Course">{s.course || 'Not set'}</Row>
            <Row icon={AcademicCapIcon} label="Year level">{yearLabel(s.year_level)}</Row>
            <Row icon={CalendarDaysIcon} label="Added">{formatDate(s.created_at)}</Row>
            <Row icon={ClockIcon} label="Last updated">{formatDate(s.updated_at)}</Row>
          </dl>
        </div>
      </article>
    </>
  );
}
