import express, { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import prisma from "../../../shared/src/db";

const router = express.Router();

//? Get the user info
//! @api/v1/users/${username}
router.get(
  "/:username",
  expressAsyncHandler(
    async (req: Request<{ username: string }>, res: Response) => {
      const username = req.params.username;
      const user = await prisma.user.findUnique({
        where: {
          username,
        },
      });

      if (!user) {
        throw new Error("User not found!");
      }

      res.json(user);
    }
  )
);

export default router;
