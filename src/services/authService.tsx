import type { User } from "../utils/csvParser";

const STORAGE_KEY = "session";

export function saveSession(user: User) {
  const safeUser = { ...user };
  delete (safeUser as any).password; // nunca guardar password
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
}

export function getSession(): User | null {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}