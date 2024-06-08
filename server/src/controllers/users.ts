import expressAsyncHandler from "express-async-handler";
import { TypedRequestParams } from "zod-express-middleware-jovan";
import * as usersSchema from "../../../shared/src/schemas/usersSchema";
import prisma from "../../../shared/src/db";
import { Response } from 'express'

export const getUser = expressAsyncHandler(
    async (
        req: TypedRequestParams<typeof usersSchema.getUserParamsSchema>, 
        res: Response
    ) => {

      const username = req.params.username;
      const user = await prisma.user.findUnique({
        where: {
          username,
        },
        select: {
            username: true,
            profileDescription: true,
            name: true
        }
      });

      if (!user) {
        throw new Error("User not found!");
      }

      res.json(user);
    }
)