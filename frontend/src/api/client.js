const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getToken() {
  return localStorage.getItem('token');
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/** Login must not send an old Bearer token (avoids odd edge cases). */
function shouldAttachAuth(path, options) {
  if (path === '/api/auth/login' && (options.method || 'GET').toUpperCase() === 'POST') {
    return false;
  }
  return !!getToken();
}

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (shouldAttachAuth(path, options)) {
    headers.Authorization = `Bearer ${getToken()}`;
  }
  const res = await fetch(`${base}${path}`, { ...options, headers });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text || 'Invalid response' };
  }

  if (!res.ok) {
    const err = new Error(data?.error || res.statusText || 'Request failed');
    err.status = res.status;
    err.details = data?.details;

    const hadAuth = !!getToken();
    const isLoginPost = path === '/api/auth/login' && (options.method || '').toUpperCase() === 'POST';

    if (hadAuth && !isLoginPost) {
      if (res.status === 401) {
        clearSession();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.replace('/login?session=expired');
        }
      } else if (
        res.status === 403 &&
        (String(data?.error || '').includes('inactive') ||
          String(data?.error || '').includes('suspended'))
      ) {
        clearSession();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.replace('/login?reason=inactive');
        }
      }
    }

    throw err;
  }

  return data;
}

export const apiBase = base;
