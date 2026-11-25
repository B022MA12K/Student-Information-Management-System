const TOKEN_KEY = 'sims_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) =>
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = form; // FormData: the browser sets the multipart header itself
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError('Could not reach the server. Check that the API and MySQL are running.', 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token && !path.startsWith('/auth/login')) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    throw new ApiError(data.error || 'The request failed', res.status, data.errors);
  }
  return data;
}

export const api = {
  login: (username, password) => request('/auth/login', { method: 'POST', body: { username, password } }),
  register: (body) => request('/auth/register', { method: 'POST', body }),
  me: () => request('/auth/me'),

  summary: () => request('/dashboard/summary'),

  listStudents: (params) => request(`/students?${new URLSearchParams(params)}`),
  getStudent: (id) => request(`/students/${id}`),
  createStudent: (form) => request('/students', { method: 'POST', form }),
  updateStudent: (id, form) => request(`/students/${id}`, { method: 'PUT', form }),
  deleteStudent: (id) => request(`/students/${id}`, { method: 'DELETE' }),

  listUsers: () => request('/users'),
  resetPassword: (id, password) => request(`/users/${id}/password`, { method: 'PUT', body: { password } }),
};
