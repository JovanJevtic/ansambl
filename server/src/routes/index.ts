import express from "express";

import authRoutes from "./auth";
import usersRoutes from "./users";

import expressAsyncHandler from "express-async-handler";

const router = express.Router();

router.get(
  "/live",
  expressAsyncHandler(async (req, res) => {
    res.status(200).send("live test");
  })
);

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);

export default router;
