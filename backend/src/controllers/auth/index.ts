import { upsertOAuthUser } from "../../db/repository/user.repository";
import { RouteContext } from "../../router/router.types";
import { generateJWTToken } from "../../services/auth";
import {
  authenticateWithCode,
  consumeState,
  createAuthUrl,
} from "../../services/oauth/google";
import env from "../../utils/environment";
import { badRequest } from "../../utils/http.errors";
import { redirect, successResponse } from "../../utils/ResponseWrapper";

const startGoogleLogin = async ({ res }: RouteContext) => {
  return redirect(res, await createAuthUrl());
};

const googleCallback = async ({ res, query }: RouteContext) => {
  const error = query.get("error");
  if (error) {
    return redirect(res, `${env.FRONTEND_URL}/?authError=${encodeURIComponent(error)}`);
  }

  const code = query.get("code") || "";
  const state = query.get("state") || "";

  if (!code) {
    throw badRequest("Missing authorization code");
  }

  if (!(await consumeState(state))) {
    throw badRequest("Invalid or expired login state");
  }

  const profile = await authenticateWithCode(code);

  const user = await upsertOAuthUser({
    provider: "google",
    providerId: profile.providerId,
    email: profile.email,
    userName: profile.userName,
    avatarUrl: profile.avatarUrl,
  });

  const token = generateJWTToken({
    userId: user._id,
    userName: user.userName,
    isGuest: false,
  });

  return redirect(res, `${env.FRONTEND_URL}/?token=${encodeURIComponent(token)}`);
};

const me = ({ res, user }: RouteContext) => {
  return successResponse(res, user, "current user");
};

const AuthController = {
  startGoogleLogin,
  googleCallback,
  me,
};

export default AuthController;
