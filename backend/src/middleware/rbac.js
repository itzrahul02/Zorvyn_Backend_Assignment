/**
 * RBAC (aligned with typical finance-dashboard assignments):
 * - viewer: read dashboard + read all transactions (no mutations)
 * - analyst: read all + create transactions + update own only
 * - admin: full CRUD on transactions + user management + delete any
 */

const capabilities = {
  viewer: new Set(['dashboard:read']),
  analyst: new Set(['dashboard:read', 'transactions:read', 'transactions:create']),
  admin: new Set([
    'dashboard:read',
    'transactions:read',
    'transactions:create',
    'transactions:delete',
    'users:manage',
  ]),
};

export function requireCapability(...required) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !capabilities[role]) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const allowed = capabilities[role];
    const ok = required.every((c) => allowed.has(c));
    if (!ok) {
      return res.status(403).json({ error: 'Insufficient permissions for this action' });
    }
    next();
  };
}
