import { useNavigate } from "react-router-dom";
import { getSession, logout } from "../services/authService";

function Navbar() {
  const navigate = useNavigate();
  const user = getSession();

  if (!user) return null;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
      <div className="container-fluid">
        
        <span className="navbar-brand">Mi App</span>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          
          {/* Menú izquierda */}
          <ul className="navbar-nav me-auto">
          </ul>

          {/* Usuario derecha */}
          <div className="d-flex align-items-center gap-3">

            <i
              className="bi bi-person-circle text-light"
              style={{ fontSize: "2rem", lineHeight: 1 }}
            ></i>

            <span className="text-white">
              {user.firstName
                ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)
                : user.username}
            </span>

            <button
              className="btn btn-sm btn-outline-light"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Logout
            </button>

          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;