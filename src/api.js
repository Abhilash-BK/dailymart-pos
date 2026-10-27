
export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("dailymart-token");
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 && token) {
    localStorage.removeItem("dailymart-token");
    window.location.reload();
  }

  return response;
}
