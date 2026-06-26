const API_BASE = "http://localhost:5000";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  "x-user-name": localStorage.getItem("username"),
  "x-user-role": localStorage.getItem("role")
});

export const getInquiries = async () => {
  const res = await fetch(`${API_BASE}/inquiries`);
  if (!res.ok) throw new Error("Failed to fetch inquiries");
  return res.json();
};

export const getDeletedInquiries = async () => {
  const res = await fetch(`${API_BASE}/inquiries/recycle-bin/all`);
  if (!res.ok) throw new Error("Failed to fetch deleted inquiries");
  return res.json();
};

export const createInquiry = async (form) => {
  const res = await fetch(`${API_BASE}/inquiries`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(form)
  });
  if (!res.ok) throw new Error("Failed to create inquiry");
  return res.text();
};

export const updateInquiry = async (id, form) => {
  const res = await fetch(`${API_BASE}/inquiries/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(form)
  });
  if (!res.ok) throw new Error("Failed to update inquiry");
  return res.text();
};

export const deleteInquiry = async (id) => {
  const res = await fetch(`${API_BASE}/inquiries/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to delete inquiry");
  return res.text();
};

export const restoreInquiry = async (id) => {
  const res = await fetch(`${API_BASE}/inquiries/${id}/restore`, {
    method: "POST",
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error("Failed to restore inquiry");
  return res.text();
};

export const permanentlyDeleteInquiry = async (id) => {
  const res = await fetch(`${API_BASE}/inquiries/${id}/permanent`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error("Forbidden: Only Administrators can permanently delete.");
    throw new Error("Failed to permanently delete inquiry");
  }
  return res.text();
};
