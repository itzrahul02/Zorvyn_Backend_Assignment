import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'viewer',
  });

  async function load() {
    const res = await api('/api/users');
    setUsers(res.users || []);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api('/api/users', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm({ email: '', password: '', name: '', role: 'viewer' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function patchUser(id, patch) {
    setError('');
    try {
      await api(`/api/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="stack">
      <section className="card">
        <h2>Create user</h2>
        <form className="form-row wrap" onSubmit={onCreate}>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password (min 8)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={8}
            required
          />
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="viewer">viewer</option>
            <option value="analyst">analyst</option>
            <option value="admin">admin</option>
          </select>
          <button type="submit">Create</button>
        </form>
      </section>

      <section className="card">
        <h2>Users</h2>
        {error && <p className="error">{error}</p>}
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = currentUser && String(u.id) === String(currentUser.id);
              return (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => patchUser(u.id, { role: e.target.value })}
                      disabled={isSelf}
                    >
                      <option value="viewer">viewer</option>
                      <option value="analyst">analyst</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>
                    {isSelf ? (
                      u.status
                    ) : (
                      <select
                        value={u.status}
                        onChange={(e) => patchUser(u.id, { status: e.target.value })}
                      >
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                        <option value="suspended">suspended</option>
                      </select>
                    )}
                  </td>
                  <td>{isSelf && <span className="muted">You</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
