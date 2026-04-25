import { Navigate } from "react-router-dom";
import { getSession } from "../services/authService";

function PublicRoute({ children }: any) {
  const user = getSession();

  if (user) {
    if (user.rol === "ADMIN") return <Navigate to="/admin" />;
    return <Navigate to="/user" />;
  }

  return children;
}

export default PublicRoute;