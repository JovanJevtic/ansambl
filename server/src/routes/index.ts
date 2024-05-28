import express from "express";

import authRoutes from "./auth";
import usersRoutes from "./users";

import expressAsyncHandler from "express-async-handler";
// import redisClient from "../utils/redis";

import { getPublicIp } from "..";

const router = express.Router();

router.get(
  "/live",
  expressAsyncHandler(async (req, res) => {
    // await redisClient.get("bla", (err, data) => {
    //   if (err) {
    //     console.log(`redis error: ${err}`)
    //   } else {
    //     console.log(`data: ${data}`)
    //   }
    // })
    getPublicIp();
    res.status(200).send("live");
  })
);

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);

export default router;
