import { jwtDecode } from "jwt-decode";

const TOKEN_KEY = "accessToken";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function isTokenValid(token) {
  if (!token) return false;
  try {
    const p = jwtDecode(token);
    if (!p.exp) return true;
    return Date.now() < p.exp * 1000;
  } catch {
    return false;
  }
}

export function getRolesFromToken(token) {
  if (!token) return [];
  try {
    const p = jwtDecode(token);

    const raw =
      // твой реальный claim из скрина:
      p["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      // запасные варианты:
      p.role ||
      p.roles ||
      p["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"];

    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
  } catch {
    return [];
  }
}
