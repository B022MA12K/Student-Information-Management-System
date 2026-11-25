import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  IdentificationIcon,
  KeyIcon,
  Squares2X2Icon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../auth.jsx';
import { initials, ROLE_LABELS } from '../utils.js';

function navFor(user) {
  if (user.role === 'student') {
    return [{ to: user.studentRef ? `/students/${user.studentRef}` : '/', label: 'My record', icon: IdentificationIcon }];
  }
  const items = [
    { to: '/dashboard', label: 'Dashboard', icon: Squares2X2Icon },
    { to: '/students', label: 'Student records', icon: UserGroupIcon },
  ];
  if (user.role === 'admin') items.push({ to: '/accounts', label: 'Accounts', icon: KeyIcon });
  return items;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app">
      {open && <div className="scrim" onClick={() => setOpen(false)} />}

      <aside className={`sidebar${open ? ' open' : ''}`} aria-label="Main">
        <div className="sidebar-head">
          <AcademicCapIcon className="icon-lg brand-mark" />
          <span className="brand-text">Student Information Management System</span>
          <button className="icon-btn on-dark close-drawer" aria-label="Close menu" onClick={() => setOpen(false)}>
            <XMarkIcon className="icon-lg" />
          </button>
        </div>

        <nav className="nav">
          {navFor(user).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon className="icon-lg" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="whoami">
            <span className="avatar sm on-dark" aria-hidden="true">{initials(user.fullName)}</span>
            <div>
              <strong>{user.fullName}</strong>
              <small>{ROLE_LABELS[user.role]}</small>
            </div>
          </div>
          <button className="btn btn-outline-dark" onClick={logout}>
            <ArrowRightOnRectangleIcon className="icon" />
            Log out
          </button>
        </div>
      </aside>

      <div className="content">
        <header className="topbar">
          <button className="icon-btn on-dark" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
            <Bars3Icon className="icon-lg" />
          </button>
          <span>Student Information Management System</span>
        </header>
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
