import { IdentificationIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import { EmptyState, Loading } from './components/States.jsx';
import Accounts from './pages/Accounts.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import StudentDetail from './pages/StudentDetail.jsx';
import StudentForm from './pages/StudentForm.jsx';
import Students from './pages/Students.jsx';

function RequireAuth({ roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="fullpage"><Loading /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

function Home() {
  const { user } = useAuth();
  if (user.role !== 'student') return <Navigate to="/dashboard" replace />;
  if (!user.studentRef) {
    return (
      <EmptyState
        icon={IdentificationIcon}
        title="No student record linked"
        text="Ask the administrator to link your account to your student record."
      />
    );
  }
  return <Navigate to={`/students/${user.studentRef}`} replace />;
}

function NotFound() {
  return (
    <div className="fullpage">
      <EmptyState
        icon={QuestionMarkCircleIcon}
        title="Page not found"
        text="The address may be wrong, or the page was moved."
        action={<Link className="btn btn-primary" to="/">Go to the start page</Link>}
      />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="students/:id" element={<StudentDetail />} />

          <Route element={<RequireAuth roles={['admin', 'staff']} />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="students/new" element={<StudentForm />} />
            <Route path="students/:id/edit" element={<StudentForm />} />
          </Route>

          <Route element={<RequireAuth roles={['admin']} />}>
            <Route path="accounts" element={<Accounts />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
