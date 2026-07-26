import HealthController from "../controllers/health";
import { Route } from "./router.types";

const healthRoutes: Route[] = [
  { method: "GET", path: "/health", handler: HealthController.check },
];

export default healthRoutes;
