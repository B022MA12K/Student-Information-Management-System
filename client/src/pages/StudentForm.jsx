import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { api } from '../api.js';
import Avatar from '../components/Avatar.jsx';
import Field from '../components/Field.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { ErrorState, Loading } from '../components/States.jsx';
import { useToast } from '../components/Toast.jsx';
import { COURSES, STATUSES, YEAR_LEVELS, ordinal } from '../utils.js';

const EMPTY = { student_id: '', name: '', email: '', course: '', year_level: '1', status: 'Active' };
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function StudentForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { notify } = useToast();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);

  const [existingPhoto, setExistingPhoto] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!editing) return;
    let ignore = false;
    setLoading(true);
    setLoadError(null);
    api
      .getStudent(id)
      .then((s) => {
        if (ignore) return;
        setForm({
          student_id: s.student_id,
          name: s.name,
          email: s.email,
          course: s.course || '',
          year_level: String(s.year_level),
          status: s.status,
        });
        setExistingPhoto(s.photo_url);
      })
      .catch((err) => !ignore && setLoadError(err.message))
      .finally(() => !ignore && setLoading(false));
    return () => { ignore = true; };
  }, [id, editing, reloadKey]);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const set = (name) => (e) => {
    setForm((f) => ({ ...f, [name]: e.target.value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  function pickPhoto(e) {
    const picked = e.target.files[0];
    e.target.value = '';
    if (!picked) return;
    if (!PHOTO_TYPES.includes(picked.type)) return setErrors((er) => ({ ...er, photo: 'Photo must be a JPG, PNG or WEBP image' }));
    if (picked.size > 2 * 1024 * 1024) return setErrors((er) => ({ ...er, photo: 'Photo must be 2 MB or smaller' }));
    setErrors((er) => ({ ...er, photo: undefined }));
    setFile(picked);
    setRemovePhoto(false);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const found = {};
    if (!form.student_id.trim()) found.student_id = 'Student ID is required';
    if (!form.name.trim()) found.name = 'Name is required';
    if (!form.email.trim()) found.email = 'Email is required';
    if (Object.keys(found).length) return setErrors(found);

    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value.trim()));
    if (file) body.append('photo', file);
    if (removePhoto) body.append('remove_photo', 'true');

    setSaving(true);
    try {
      if (editing) await api.updateStudent(id, body);
      else await api.createStudent(body);
      notify(editing ? 'Changes saved' : 'Student added');
      navigate(editing ? `/students/${id}` : '/students');
    } catch (err) {
      if (err.errors && Object.keys(err.errors).length) setErrors(err.errors);
      else notify(err.message, 'error');
      setSaving(false);
    }
  }

  const backTo = editing ? `/students/${id}` : '/students';
  const title = editing ? 'Edit student' : 'Add student';
  const shownPhoto = preview || (removePhoto ? null : existingPhoto);

  if (loading) return <Loading label="Loading the record…" />;
  if (loadError) return <ErrorState message={loadError} onRetry={() => setReloadKey((k) => k + 1)} />;

  const bad = (name) => Boolean(errors[name]) || undefined;

  return (
    <>
      <PageHeader title={title} subtitle={editing ? 'Change the details, then save.' : 'Fill in the student details.'}>
        <Link className="btn btn-secondary" to={backTo}>
          <ArrowLeftIcon className="icon" />
          Back
        </Link>
      </PageHeader>

      <form className="panel panel-pad form" onSubmit={onSubmit} noValidate>
        <div className="photo-field">
          <Avatar src={shownPhoto} name={form.name || 'Student'} size="portrait" />
          <div>
            <input id="photo" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={pickPhoto} />
            <label htmlFor="photo" className="btn btn-secondary">
              <ArrowUpTrayIcon className="icon" />
              {shownPhoto ? 'Change photo' : 'Upload photo'}
            </label>
            {(file || (existingPhoto && !removePhoto)) && (
              <button
                type="button"
                className="btn btn-quiet"
                onClick={() => { setFile(null); setRemovePhoto(Boolean(existingPhoto)); }}
              >
                <TrashIcon className="icon" />
                Remove photo
              </button>
            )}
            <p className="hint">JPG, PNG or WEBP, up to 2 MB.</p>
            {errors.photo && <p className="error-text" role="alert">{errors.photo}</p>}
          </div>
        </div>

        <div className="form-grid">
          <Field label="Student ID" htmlFor="student_id" error={errors.student_id} required>
            <input id="student_id" type="text" value={form.student_id} onChange={set('student_id')} aria-invalid={bad('student_id')} />
          </Field>
          <Field label="Full name" htmlFor="name" error={errors.name} required>
            <input id="name" type="text" value={form.name} onChange={set('name')} autoComplete="off" aria-invalid={bad('name')} />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email} required>
            <input id="email" type="email" value={form.email} onChange={set('email')} autoComplete="off" aria-invalid={bad('email')} />
          </Field>
          <Field label="Course" htmlFor="course" error={errors.course}>
            <input id="course" type="text" list="course-list" value={form.course} onChange={set('course')} aria-invalid={bad('course')} />
            <datalist id="course-list">{COURSES.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="Year level" htmlFor="year_level" error={errors.year_level}>
            <select id="year_level" value={form.year_level} onChange={set('year_level')}>
              {YEAR_LEVELS.map((y) => <option key={y} value={y}>{ordinal(y)} year</option>)}
            </select>
          </Field>
          <Field label="Status" htmlFor="status" error={errors.status}>
            <select id="status" value={form.status} onChange={set('status')}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        <div className="form-actions">
          <Link className="btn btn-secondary" to={backTo}>Cancel</Link>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add student'}
          </button>
        </div>
      </form>
    </>
  );
}
