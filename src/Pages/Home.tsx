import { useNavigate } from "react-router-dom";
import bgImage from "../assets/hero.png";

function Home() {
  const navigate = useNavigate();

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{ backgroundColor: "#B0B0B0" }}
    >

      <div
        className="text-center p-4 rounded shadow"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          width: "90%",
          maxWidth: "400px",
          color: "white"
        }}
      > 
      
        <h1 className="mb-4">Bienvenido</h1>

        <p className="mb-4">
          Accede a tu cuenta o crea una nueva
        </p>

        <div className="d-grid gap-3">
          <button
            className="btn btn-modern btn-login"
            onClick={() => navigate("/login")}
          >
            <i className="bi bi-box-arrow-in-right me-2"></i>
            Login
          </button>

          <button
            className="btn btn-modern btn-signup"
            onClick={() => navigate("/signup")}
          >
            <i className="bi bi-person-plus me-2"></i>
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;