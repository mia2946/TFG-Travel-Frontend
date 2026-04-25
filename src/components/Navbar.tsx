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
            <li className="nav-item">
              <span className="nav-link" style={{ cursor: "pointer" }}>
                Inicio
              </span>
            </li>
          </ul>

          {/* Usuario derecha */}
          <div className="d-flex align-items-center gap-3">
            
            <img
              src="https://i.pravatar.cc/40"
              alt="user"
              className="rounded-circle"
              width="40"
              height="40"
            />

            <span className="text-white">
              {user.firstName} {user.lastName}
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