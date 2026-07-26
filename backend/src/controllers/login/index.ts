import { createGuestSession } from "../../services/identity";
import { RouteContext } from "../../router/router.types";
import { successResponse } from "../../utils/ResponseWrapper";

const loginGuest = ({ res, query }: RouteContext) => {
  const session = createGuestSession(query.get("userName") || "");
  return successResponse(res, session, "guest login successful");
};

const LoginController = {
  loginGuest,
};

export default LoginController;
