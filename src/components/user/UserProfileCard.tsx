import type { User } from "../../utils/csvParser";

type Props = {
  user: User | null;
};

export default function UserProfileCard({ user }: Props) {
  if (!user) {
    return (
      <div className="alert alert-warning mb-4">
        No hay ningún usuario logado.
      </div>
    );
  }

  return (
    <div className="card bg-dark text-light shadow mb-4">
      <div className="card-body">
        <h4 className="card-title mb-4">
          {user.firstName} {user.lastName}
        </h4>

        <div className="row">
          <div className="col-12 col-md-6">
            <p>
              <strong>Username:</strong> {user.username}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Phone:</strong> {user.phone}
            </p>
          </div>

          <div className="col-12 col-md-6">
            <p>
              <strong>Country:</strong> {user.country}
            </p>
            <p>
              <strong>Language:</strong> {user.language}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className={`badge ${user.active ? "bg-success" : "bg-danger"}`}>
                {user.active ? "Activo" : "Inactivo"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}