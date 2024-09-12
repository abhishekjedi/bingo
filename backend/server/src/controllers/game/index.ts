import express from "express";
import GameController from "./gameController";

const router = express.Router();

router.get("/id", GameController.generateGameId);

export default router;
