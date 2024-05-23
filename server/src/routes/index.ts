import express from "express";

import authRoutes from "./auth";
import usersRoutes from "./users";
import env from "../utils/env";

const router = express.Router();

router.get("/live", (req, res) => {
  console.log("/render/test");
  console.log(`ENV: ${env.NODE_ENV}`)
  res.status(200).send("live");
});

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);

export default router;
