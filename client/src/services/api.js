const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

async function fetchJSON(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok && !data.message) {
        data.message = `HTTP error ${res.status}`;
      }
      return data;
    }
    const text = await res.text();
    if (!res.ok) {
      return { success: false, message: `Server returned status ${res.status}: ${text.slice(0, 100)}` };
    }
    try {
      return JSON.parse(text);
    } catch {
      return { success: true, text };
    }
  } catch (err) {
    return { success: false, message: err.message || 'Network connection failed' };
  }
}

export async function checkHealth() {
  return await fetchJSON(`${API_BASE_URL}/api/health`);
}

export async function loginAPI(credentials) {
  return await fetchJSON(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
}

export async function registerAPI(userData) {
  return await fetchJSON(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
}

export async function sendOTPAPI(target, type = 'phone') {
  return await fetchJSON(`${API_BASE_URL}/api/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, type })
  });
}

export async function verifyOTPAPI(target, otp) {
  return await fetchJSON(`${API_BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, otp })
  });
}

export async function sendTestMailAPI(email) {
  return await fetchJSON(`${API_BASE_URL}/api/auth/test-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
}

export async function fetchComplaints() {
  const res = await fetch(`${API_BASE_URL}/api/complaints`);
  const data = await res.json();
  return data.data || [];
}

export async function submitComplaint(payload) {
  const res = await fetch(`${API_BASE_URL}/api/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.data;
}

export async function assignWorkerAPI(ticketId, workerId) {
  const res = await fetch(`${API_BASE_URL}/api/complaints/${ticketId}/assign`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workerId })
  });
  const data = await res.json();
  return data.data;
}

export async function updateStatusAPI(ticketId, status) {
  const res = await fetch(`${API_BASE_URL}/api/complaints/${ticketId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  return data.data;
}

export async function resolveComplaintAPI(ticketId, { afterImageUrl, notes }) {
  const res = await fetch(`${API_BASE_URL}/api/complaints/${ticketId}/resolve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ afterImageUrl, notes })
  });
  const data = await res.json();
  return data.data;
}

// Workers Management
export async function fetchWorkers() {
  const res = await fetch(`${API_BASE_URL}/api/workers`);
  const data = await res.json();
  return data.data || [];
}

export async function addWorkerAPI(workerData) {
  const res = await fetch(`${API_BASE_URL}/api/workers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workerData)
  });
  return res.json();
}

export async function deleteWorkerAPI(workerId) {
  const res = await fetch(`${API_BASE_URL}/api/workers/${workerId}`, {
    method: 'DELETE'
  });
  return res.json();
}

// Admin Users Audit
export async function fetchAllUsersAPI() {
  const res = await fetch(`${API_BASE_URL}/api/admin/users`);
  const data = await res.json();
  return data.data || [];
}

// Admin Data Collection & Export
export async function exportDataAPI() {
  const res = await fetch(`${API_BASE_URL}/api/admin/export`);
  return res.json();
}
