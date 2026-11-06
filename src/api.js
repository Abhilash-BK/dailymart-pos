
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("dailymart-token");
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Support both relative API paths and existing absolute URLs
  const endpoint = url.startsWith("http")
    ? url.replace("http://localhost:5000", API_URL)
    : `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401 && token) {
    localStorage.removeItem("dailymart-token");
    window.location.reload();
  }

  return response;
}
