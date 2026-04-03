import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sessionHint = useMemo(() => {
    const reason = searchParams.get('reason');
    const session = searchParams.get('session');
    if (reason === 'inactive') {
      return 'Your session ended because the account was inactive. Sign in again after an admin reactivates you.';
    }
    if (session === 'expired') {
      return 'Your session expired. Please sign in again.';
    }
    return '';
  }, [searchParams]);

  function clearQueryHint() {
    if (searchParams.toString()) {
      setSearchParams({}, { replace: true });
    }
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      clearQueryHint();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Zorvyn</h1>
        <p className="muted">Finance dashboard</p>
        {sessionHint && (
          <p className="session-hint" role="status">
            {sessionHint}
          </p>
        )}
        <form onSubmit={onSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
