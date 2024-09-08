import express from "express";
import LoginController from "./login.controller";

const router = express.Router();

router.get("/guest", LoginController.loginGuest);

export default router;
