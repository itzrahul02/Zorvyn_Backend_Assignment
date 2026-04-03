import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { TRANSACTION_CATEGORIES } from '../constants/finance';

function formatMoney(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
}

function sameId(a, b) {
  return String(a) === String(b);
}

export default function Transactions() {
  const { user } = useAuth();
  const role = user?.role;
  const canCreate = role === 'analyst' || role === 'admin';
  const canDelete = role === 'admin';
  const showActions = role !== 'viewer';
  const canEdit = (t) => role === 'admin' || (role === 'analyst' && t.createdBy && sameId(t.createdBy.id, user?.id));

  const [data, setData] = useState({ data: [], page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ type: '', category: '', q: '', page: 1 });
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    amount: '',
    type: 'expense',
    category: 'food',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
  });
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setError('');
    const params = new URLSearchParams();
    params.set('page', String(filters.page));
    params.set('limit', '15');
    if (filters.type) params.set('type', filters.type);
    if (filters.category) params.set('category', filters.category);
    if (filters.q) params.set('q', filters.q);
    const res = await api(`/api/transactions?${params.toString()}`);
    setData(res);
  }, [filters.page, filters.type, filters.category, filters.q]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  async function createTx(e) {
    e.preventDefault();
    setError('');
    try {
      await api('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(form.amount),
          type: form.type,
          category: form.category,
          date: new Date(form.date).toISOString(),
          notes: form.notes,
        }),
      });
      setForm((f) => ({
        ...f,
        amount: '',
        notes: '',
      }));
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editing) return;
    setError('');
    try {
      await api(`/api/transactions/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          amount: Number(editing.amount),
          type: editing.type,
          category: editing.category,
          date: new Date(editing.date).toISOString(),
          notes: editing.notes,
        }),
      });
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeTx(id) {
    if (!confirm('Soft-delete this transaction?')) return;
    setError('');
    try {
      await api(`/api/transactions/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="stack">
      {canCreate && (
        <section className="card">
          <h2>New transaction</h2>
          <form className="form-row" onSubmit={createTx}>
            <input
              placeholder="Amount"
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="income">income</option>
              <option value="expense">expense</option>
            </select>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {TRANSACTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <input
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <button type="submit">Add</button>
          </form>
        </section>
      )}

      {editing && (
        <section className="card">
          <h2>Edit transaction</h2>
          <form className="form-row wrap" onSubmit={saveEdit}>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={editing.amount}
              onChange={(e) => setEditing({ ...editing, amount: e.target.value })}
              required
            />
            <select
              value={editing.type}
              onChange={(e) => setEditing({ ...editing, type: e.target.value })}
            >
              <option value="income">income</option>
              <option value="expense">expense</option>
            </select>
            <select
              value={editing.category}
              onChange={(e) => setEditing({ ...editing, category: e.target.value })}
            >
              {TRANSACTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={editing.date.slice(0, 10)}
              onChange={(e) => setEditing({ ...editing, date: e.target.value })}
            />
            <input
              value={editing.notes}
              onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
            />
            <button type="submit">Save</button>
            <button type="button" className="link" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </form>
        </section>
      )}

      <section className="card">
        <h2>All transactions</h2>
        <div className="form-row filters">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
          >
            <option value="">All types</option>
            <option value="income">income</option>
            <option value="expense">expense</option>
          </select>
          <input
            placeholder="Category (exact or partial)"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
          />
          <input
            placeholder="Search notes/category"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value, page: 1 })}
          />
        </div>
        {error && <p className="error">{error}</p>}
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Amount</th>
              <th>By</th>
              {showActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.data?.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.date).toLocaleDateString()}</td>
                <td>{t.type}</td>
                <td>{t.category}</td>
                <td>{formatMoney(t.amount)}</td>
                <td className="muted">{t.createdBy?.name || '—'}</td>
                {showActions && (
                  <td>
                    {canEdit(t) && !editing && (
                      <button
                        type="button"
                        className="link"
                        onClick={() =>
                          setEditing({
                            id: t.id,
                            amount: String(t.amount),
                            type: t.type,
                            category: t.category,
                            date:
                              typeof t.date === 'string'
                                ? t.date
                                : new Date(t.date).toISOString(),
                            notes: t.notes || '',
                          })
                        }
                      >
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <>
                        {' '}
                        <button type="button" className="link danger" onClick={() => removeTx(t.id)}>
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <button
            type="button"
            disabled={filters.page <= 1}
            onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
          >
            Prev
          </button>
          <span className="muted">
            Page {data.page} / {data.totalPages}
          </span>
          <button
            type="button"
            disabled={filters.page >= data.totalPages}
            onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
