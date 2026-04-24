const API = '/api';

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function handleUnauthorized(res) {
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  return res;
}

export async function login(email, password) {
  let res;
  try {
    res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
  } catch (networkErr) {
    throw new Error('Cannot connect to server. Make sure the backend is running on port 3001.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(err.error || err.message || 'Login failed');
  }
  return res.json();
}

export async function fetchItems(endpoint) {
  const res = await fetch(`${API}/${endpoint}`, { headers: getHeaders() });
  handleUnauthorized(res);
  if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
  return res.json();
}

export async function fetchItem(endpoint, id) {
  const res = await fetch(`${API}/${endpoint}/${id}`, { headers: getHeaders() });
  handleUnauthorized(res);
  if (!res.ok) throw new Error(`Failed to fetch ${endpoint}/${id}`);
  return res.json();
}

export async function createItem(endpoint, data) {
  const res = await fetch(`${API}/${endpoint}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  handleUnauthorized(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Create failed' }));
    throw new Error(err.message || 'Create failed');
  }
  return res.json();
}

export async function updateItem(endpoint, id, data) {
  const res = await fetch(`${API}/${endpoint}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  handleUnauthorized(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Update failed' }));
    throw new Error(err.message || 'Update failed');
  }
  return res.json();
}

export async function deleteItem(endpoint, id) {
  const res = await fetch(`${API}/${endpoint}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  handleUnauthorized(res);
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
}

export async function runAI(feature, data) {
  const res = await fetch(`${API}/ai/${feature}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  handleUnauthorized(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'AI analysis failed' }));
    throw new Error(err.message || 'AI analysis failed');
  }
  return res.json();
}

export async function fetchReportsSummary() {
  const res = await fetch(`${API}/reports/summary`, { headers: getHeaders() });
  handleUnauthorized(res);
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
}
