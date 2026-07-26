import { RouteContext } from "../../router/router.types";
import { successResponse } from "../../utils/ResponseWrapper";

const check = ({ res }: RouteContext) => {
  return successResponse(res, { status: "ok" }, "Server is up and running");
};

const HealthController = {
  check,
};

export default HealthController;
