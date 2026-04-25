import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/userService";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = await login(username, password);

    if (!user) {
      setError("Credenciales incorrectas");
      return;
    }

    if (!user.active) {
      setError("Tu usuario está inactivo");
      return;
    }

    if (user.rol === "ADMIN") navigate("/admin");
    else navigate("/user");
  };

  return (
    <div data-bs-theme="light" className="d-flex justify-content-center align-items-center vh-100">
      
      <form
        onSubmit={handleLogin}
        className="p-4 rounded shadow"
        style={{
          width: "90%",
          maxWidth: "400px",
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(10px)",
          color: "white"
        }}
      >
        <h2 className="mb-4 text-center">Login</h2>

        {error && (
          <div className="alert alert-danger">{error}</div>
        )}

        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Username"
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
          required
          />
        </div>

        <div className="mb-4">
          <input
            type="password"
            className="form-control"
            placeholder="Password"
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            required
          />
        </div>

        <button className="btn btn-modern btn-login w-100">
          <i className="bi bi-box-arrow-in-right me-2"></i>
          Entrar
        </button>
      </form>
    </div>
  );
}

export default Login;