import { AcademicCapIcon } from '@heroicons/react/24/outline';

export default function AuthShell({ title, subtitle, footer, children }) {
  return (
    <div className="auth">
      <aside className="auth-side">
        <AcademicCapIcon className="icon-xl" />
        <p className="auth-name">Student Information Management System</p>
        <p className="auth-line">Find, view and update student records in one place.</p>
      </aside>
      <main className="auth-main">
        <div className="auth-box">
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
          {children}
          {footer && <p className="auth-foot">{footer}</p>}
        </div>
      </main>
    </div>
  );
}
