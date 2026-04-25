import type { User } from "../utils/csvParser";
import { saveSession } from "./authService";
import { hashPassword } from "../utils/hash";


let usersCache: User[] = [];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const LOGIN_PATH = import.meta.env.VITE_LOGIN_PATH;
const USERS_ALL_PATH = import.meta.env.VITE_USERS_ALL_PATH;
const USERS_CREATE_PATH = import.meta.env.VITE_USERS_CREATE_PATH;

type BackendUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  phone: string;
  role: "ADMIN" | "USER";
  registrationDate: string;
  language: string;
  country: string;
};

function mapBackendUserToUser(user: BackendUser): User {
  return {
    id: user.id,
    username: user.email,
    password: user.passwordHash,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    country: user.country,
    language: user.language,
    active: true,
    rol: user.role,
    fecha: user.registrationDate,
  };
}

export function clearUsersCache() {
  usersCache = [];
}

export async function login(
  username: string,
  password: string
): Promise<User | null> {

  const url = new URL(`${API_BASE_URL}${LOGIN_PATH}`);

  const passwordHash = await hashPassword(password);

  url.searchParams.append("username", username);
  url.searchParams.append("password", passwordHash);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 401 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Login error: ${response.status}`);
  }

  const backendUser: BackendUser = await response.json();
  const user = mapBackendUserToUser(backendUser);

  saveSession(user);

  return user;
}

export async function loadUsers(): Promise<User[]> {
  if (usersCache.length) return usersCache;

  const response = await fetch(`${API_BASE_URL}${USERS_ALL_PATH}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Load users error: ${response.status}`);
  }

  const backendUsers: BackendUser[] = await response.json();

  usersCache = backendUsers.map(mapBackendUserToUser);

  return usersCache;
}

export async function register(userData: {
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  language: string;
}) {

  const passwordHash = await hashPassword(userData.password);
  console.log(passwordHash);
  
  const requestBody = {
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    passwordHash: passwordHash,
    phone: userData.phone,
    role: "USER",
    registrationDate: new Date().toISOString(),
    language: userData.language,
    country: userData.country,
  };

  const response = await fetch(`${API_BASE_URL}${USERS_CREATE_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (response.status === 400) {
    throw new Error("Datos inválidos o usuario ya existente");
  }

  if (!response.ok) {
    throw new Error(`Register error: ${response.status}`);
  }

  const backendUser: BackendUser = await response.json();
  const newUser = mapBackendUserToUser(backendUser);

  clearUsersCache();

  return newUser;
}