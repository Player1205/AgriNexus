import { getBaseApiUrl } from "./api";

const TOKEN_KEY = "agrinexus_auth_token";
const USER_KEY = "agrinexus_auth_user";

const authRequest = async (path, options = {}) => {
  const baseUrl = getBaseApiUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || "Authentication request failed");
    error.status = response.status;
    throw error;
  }
  return body;
};

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

export const login = async (email, password) => {
  const result = await authRequest("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem(TOKEN_KEY, result.token);
  localStorage.setItem(USER_KEY, JSON.stringify(result.user));
  return result.user;
};

export const register = async (name, email, password) => {
  const result = await authRequest("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  localStorage.setItem(TOKEN_KEY, result.token);
  localStorage.setItem(USER_KEY, JSON.stringify(result.user));
  return result.user;
};

export const getCurrentUser = async () => {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const user = await authRequest("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch (error) {
    if (error.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }
    const cachedUser = localStorage.getItem(USER_KEY);
    return cachedUser ? JSON.parse(cachedUser) : null;
  }
};

export const logout = async () => {
  const token = getAuthToken();
  if (token)
    await authRequest("/api/v1/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
