const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TOKEN_KEY = "wire_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getWsUrl(path) {
  const wsBase = API_URL.replace(/^http/, "ws");
  return `${wsBase}${path}`;
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body, auth = true, params } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let url = `${API_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
    ).toString();
    if (qs) url += `?${qs}`;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Не удалось связаться с сервером. Проверьте подключение.", 0);
  }

  if (res.status === 204) return null;

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const detail = data?.detail || "Что-то пошло не так";
    throw new ApiError(typeof detail === "string" ? detail : "Что-то пошло не так", res.status);
  }

  return data;
}

export const api = {
  get: (path, params) => request(path, { method: "GET", params }),
  post: (path, body, opts = {}) => request(path, { method: "POST", body, ...opts }),
  delete: (path) => request(path, { method: "DELETE" }),
};

export { ApiError, API_URL };
