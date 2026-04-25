import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { loadUsers, clearUsersCache } from "../../services/userService";
import type { User } from "../../utils/csvParser";

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadUsers().then(setUsers);
  }, []);

  // 🔁 Activar / desactivar usuario
  const toggleUser = async (username: string) => {
    const allUsers = await loadUsers();

    const userToUpdate = allUsers.find(u => u.username === username);
    if (!userToUpdate) return;

    const updatedUser = {
      ...userToUpdate,
      active: !userToUpdate.active
    };

    // 🔥 ACTUALIZACIÓN INMEDIATA EN UI (UX PRO)
    setUsers(prev =>
      prev.map(u =>
        u.username === username ? updatedUser : u
      )
    );

    // 🔧 Persistencia en localStorage
    const localUsers: User[] = JSON.parse(
      localStorage.getItem("users") || "[]"
    );

    const index = localUsers.findIndex(
      u => u.username === username
    );

    if (index >= 0) {
      localUsers[index] = updatedUser;
    } else {
      localUsers.push(updatedUser);
    }

    localStorage.setItem("users", JSON.stringify(localUsers));

    // 🔥 Limpiar cache y recargar datos reales
    clearUsersCache();
    loadUsers().then(setUsers);
  };

  return (
    <>
      <Navbar />

      <div className="container mt-4">
        <h2 className="mb-4">Panel de Administración</h2>

        <div className="container mt-4">
          <table className="table table-dark table-striped align-middle">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {users.map(user => (
                <tr key={user.username}>
                  <td data-label="Username">{user.username}</td>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="Nombre">
                    {user.firstName} {user.lastName}
                  </td>
                  <td data-label="Rol">{user.rol}</td>

                  <td data-label="Estado">
                    <span className={`badge ${user.active ? "bg-success" : "bg-danger"}`}>
                      {user.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  <td data-label="Acciones">
                    <button
                      className={`btn btn-sm ${
                        user.active ? "btn-warning" : "btn-success"
                      }`}
                      onClick={() => toggleUser(user.username)}
                    >
                      {user.active ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
    </>
  );
}