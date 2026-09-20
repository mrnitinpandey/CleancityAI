const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function checkHealth() {
  const res = await fetch(`${API_BASE_URL}/api/health`);
  return res.json();
}

export async function loginAPI(credentials) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  return res.json();
}

export async function registerAPI(userData) {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return res.json();
}

export async function sendOTPAPI(target, type = 'phone') {
  const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, type })
  });
  return res.json();
}

export async function verifyOTPAPI(target, otp) {
  const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, otp })
  });
  return res.json();
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
