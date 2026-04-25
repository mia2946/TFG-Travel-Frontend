import { parseCSV } from "../utils/csvParser";
import type { User } from "../utils/csvParser";
import { hashPassword } from "../utils/hash";
import { saveSession } from "./authService";


let usersCache: User[] = [];

export function clearUsersCache() {
  usersCache = [];
}

export async function login(username: string, password: string) {
  const users = await loadUsers();
  const hashed = await hashPassword(password);

  const user = users.find(
    u => u.username === username && u.password === hashed
  );

  if (user) {
    saveSession(user);
  }

  return user || null;
}


export async function loadUsers(): Promise<User[]> {
  if (usersCache.length) return usersCache;

  const res = await fetch("/src/assets/bd_users.csv");
  const text = await res.text();

  const csvUsers = parseCSV(text);

  const localUsers: User[] = JSON.parse(
    localStorage.getItem("users") || "[]"
  );

  // 🔥 FUSIÓN INTELIGENTE
  const mergedUsers = csvUsers.map(csvUser => {
    const local = localUsers.find(
      l => l.username === csvUser.username
    );

    return local || csvUser;
  });

  // Añadir usuarios nuevos (que no están en CSV)
  const newUsers = localUsers.filter(
    l => !csvUsers.find(c => c.username === l.username)
  );

  usersCache = [...mergedUsers, ...newUsers];

  return usersCache;
}

export async function register(userData: {
  id: number;
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  language: string;
  active: boolean;
}) {
  const users = await loadUsers();

  if (users.find(u => u.username === userData.username)) {
    throw new Error("El username ya existe");
  }

  const hashed = await hashPassword(userData.password);

  const newUser: User = {
    ...userData,
    active: true,
    password: hashed,
    rol: "USER",
    fecha: new Date().toISOString()
  };

  const localUsers = JSON.parse(localStorage.getItem("users") || "[]");
  localUsers.push(newUser);

  localStorage.setItem("users", JSON.stringify(localUsers));

  usersCache.push(newUser);

  return newUser;
}