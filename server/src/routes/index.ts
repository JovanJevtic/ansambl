import express from "express";

import authRoutes from "./auth";
import usersRoutes from "./users";

import expressAsyncHandler from "express-async-handler";
import redisClient from "../utils/redis";

const router = express.Router();

router.get(
  "/live",
  expressAsyncHandler(async (req, res) => {
    await redisClient.connect();
    const redisResponse = await redisClient.get("user");
    res.status(200).send("live");
  })
);

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);

export default router;
