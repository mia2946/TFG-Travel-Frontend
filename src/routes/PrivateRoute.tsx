import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getSession } from "../services/authService";

type PrivateRouteProps = {
  children: ReactNode;
  role?: "ADMIN" | "USER";
};

export default function PrivateRoute({ children, role }: PrivateRouteProps) {
  const user = getSession();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.rol !== role) {
    return <Navigate to="/login" replace />;
  }

  return children;
}