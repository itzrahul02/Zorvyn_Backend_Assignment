import { useEffect, useState } from 'react';
import { api } from '../api/client';

function formatMoney(n) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [trends, setTrends] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, r, t] = await Promise.all([
          api('/api/dashboard/summary'),
          api('/api/dashboard/recent?limit=8'),
          api('/api/dashboard/trends?groupBy=month&span=6'),
        ]);
        if (!cancelled) {
          setSummary(s);
          setRecent(r.items || []);
          setTrends(t);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!summary) return <p className="muted">Loading dashboard…</p>;

  const monthPoints =
    trends?.points?.filter((p) => p.type === 'income' || p.type === 'expense') || [];

  return (
    <div className="stack">
      <section className="grid stats">
        <div className="card stat">
          <span className="muted">Total income</span>
          <strong>{formatMoney(summary.totalIncome)}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Total expenses</span>
          <strong>{formatMoney(summary.totalExpense)}</strong>
        </div>
        <div className="card stat highlight">
          <span className="muted">Net balance</span>
          <strong>{formatMoney(summary.netBalance)}</strong>
        </div>
      </section>

      <section className="card">
        <h2>By category</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Type</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {summary.categoryBreakdown?.length ? (
              summary.categoryBreakdown.map((row, i) => (
                <tr key={`${row.category}-${row.type}-${i}`}>
                  <td>{row.category}</td>
                  <td>{row.type}</td>
                  <td>{formatMoney(row.total)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="muted">
                  No data yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>Monthly trends (income vs expense)</h2>
        <div className="trend-bars">
          {monthPoints.length === 0 ? (
            <p className="muted">No trend data for this range.</p>
          ) : (
            (() => {
              const byPeriod = new Map();
              for (const p of monthPoints) {
                const key = `${p.period.year}-${p.period.month}`;
                if (!byPeriod.has(key)) byPeriod.set(key, { year: p.period.year, month: p.period.month, income: 0, expense: 0 });
                const row = byPeriod.get(key);
                if (p.type === 'income') row.income += p.total;
                if (p.type === 'expense') row.expense += p.total;
              }
              const rows = [...byPeriod.values()].sort((a, b) =>
                a.year !== b.year ? a.year - b.year : a.month - b.month
              );
              const max = Math.max(1, ...rows.flatMap((r) => [r.income, r.expense]));
              return rows.map((r) => (
                <div key={`${r.year}-${r.month}`} className="trend-row">
                  <span className="trend-label">
                    {r.year}-{String(r.month).padStart(2, '0')}
                  </span>
                  <div className="bar-wrap">
                    <div
                      className="bar income"
                      style={{ width: `${(r.income / max) * 100}%` }}
                      title={`Income ${formatMoney(r.income)}`}
                    />
                    <div
                      className="bar expense"
                      style={{ width: `${(r.expense / max) * 100}%` }}
                      title={`Expense ${formatMoney(r.expense)}`}
                    />
                  </div>
                </div>
              ));
            })()
          )}
        </div>
      </section>

      <section className="card">
        <h2>Recent activity</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.date).toLocaleDateString()}</td>
                <td>{t.type}</td>
                <td>{t.category}</td>
                <td>{formatMoney(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
