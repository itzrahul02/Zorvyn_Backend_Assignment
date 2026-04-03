import { Navigate, Outlet, Route, Routes, Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Users from './pages/Users';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const loc = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }
  return children;
}

function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          Zorvyn
        </Link>
        <nav className="nav">
          <Link to="/">Dashboard</Link>
          <Link to="/transactions">Transactions</Link>
          {user?.role === 'admin' && <Link to="/users">Users</Link>}
        </nav>
        <div className="user-meta">
          <span className="muted">
            {user?.name} · {user?.role}
          </span>
          <button type="button" className="link" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/transactions"
          element={
            <RoleGate allow={['viewer', 'analyst', 'admin']}>
              <Transactions />
            </RoleGate>
          }
        />
        <Route
          path="/users"
          element={
            <RoleGate allow={['admin']}>
              <Users />
            </RoleGate>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RoleGate({ allow, children }) {
  const { user } = useAuth();
  if (!allow.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
