import express from "express";

import authRoutes from "./auth";
import usersRoutes from "./users";

const router = express.Router();

router.get("/live", (req, res) => {
  res.status(200).send("live");
});

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);

export default router;
