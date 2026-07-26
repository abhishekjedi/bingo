import AuthController from "../controllers/auth";
import { Route } from "./router.types";

const authRoutes: Route[] = [
  {
    method: "GET",
    path: "/api/auth/google",
    handler: AuthController.startGoogleLogin,
  },
  {
    method: "GET",
    path: "/api/auth/google/callback",
    handler: AuthController.googleCallback,
  },
  {
    method: "GET",
    path: "/api/auth/me",
    handler: AuthController.me,
    requiresAuth: true,
  },
];

export default authRoutes;
