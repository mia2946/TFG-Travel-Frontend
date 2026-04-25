import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/userService";

function SignUp() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
    repeatPassword: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    country: "",
    language: ""
  });

  const [error, setError] = useState("");

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    if (form.password !== form.repeatPassword) {
        setError("Las contraseñas no coinciden");
        return;
    }
    
    try {
        const { repeatPassword, ...userData } = form;
        await register(userData);
        navigate("/login");
    } catch (err: any) {
        setError(err.message);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <form
        onSubmit={handleSubmit}
        className="p-4 rounded shadow"
        style={{
          width: "95%",
          maxWidth: "500px",
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(10px)",
          color: "white"
        }}
      >
        <h2 className="mb-4 text-center">Crear cuenta</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row">
          <div className="col-6 mb-3">
            <input name="firstName" className="form-control" placeholder="Nombre" onChange={handleChange} required />
          </div>
          <div className="col-6 mb-3">
            <input name="lastName" className="form-control" placeholder="Apellido" onChange={handleChange} required />
          </div>
        </div>

        <input type="email" name="email" className="form-control mb-3" placeholder="Username (email)" onChange={handleChange} required />
        <input type="password"
            name="password"
            className="form-control mb-3"
            placeholder="Password"
            onChange={handleChange}
            required
        />
        <input type="password"
            name="repeatPassword"
            className="form-control mb-3"
            placeholder="Repetir Password"
            onChange={handleChange}
            required
        />
        {form.repeatPassword && form.password !== form.repeatPassword && (
                <small className="text-danger">
                    Las contraseñas no coinciden
                </small>
            )}
        <input name="phone" className="form-control mb-3" placeholder="Teléfono" onChange={handleChange} />

        <div className="row">
          <div className="col-6 mb-3">
            <input name="country" className="form-control" placeholder="País" onChange={handleChange} />
          </div>
          <div className="col-6 mb-3">
            <input name="language" className="form-control" placeholder="Idioma" onChange={handleChange} />
          </div>
        </div>

        <button className="btn btn-modern btn-signup w-100">
          Crear cuenta
        </button>
      </form>
    </div>
  );
}

export default SignUp;