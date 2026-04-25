export interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  language: string;
  rol: "USER" | "ADMIN";
  fecha: string;
  active: boolean;
}

export function parseCSV(text: string): User[] {
  const lines = text.split("\n").slice(1);

  return lines
    .filter(line => line.trim() !== "")
    .map(line => {
      const [
        username,
        password,
        email,
        firstName,
        lastName,
        phone,
        country,
        language,
        rol,
        fecha
      ] = line.split(";");

      return {
        id: -1,
        username,
        password,
        email,
        firstName,
        lastName,
        phone,
        country,
        language,
        rol: rol as "USER" | "ADMIN",
        fecha,
        active: true
      };
    });
}