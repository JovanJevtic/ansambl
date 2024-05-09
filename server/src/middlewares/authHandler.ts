import { NextFunction, Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import jsonwebtoken, { JwtPayload } from "jsonwebtoken";
import { UserWithoutPassword } from "src/types/express";
import prisma from "../../../shared/src/db";
import env from "../utils/env";

const protect = expressAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let token: string;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      try {
        token = req.headers.authorization.split(" ")[1];

        const decoded = jsonwebtoken.verify(
          token,
          env.JWT_SECRET
        ) as JwtPayload;

        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: {
            password: false,
            phone: true,
            adress: true,
            birthday: true,
            email: true,
            gender: true,
            googleId: true,
            id: true,
            interests: true,
            isPremium: true,
            name: true,
            role: true,
            type: true,
            username: true,
          },
        });

        if (!user) {
          res.status(StatusCodes.UNAUTHORIZED);
          throw new Error(getReasonPhrase(StatusCodes.UNAUTHORIZED));
        }

        req.user = user as UserWithoutPassword;

        next();
      } catch (error) {
        res.status(StatusCodes.UNAUTHORIZED);
        throw new Error(getReasonPhrase(StatusCodes.UNAUTHORIZED));
      }
    } else {
      res.status(StatusCodes.UNAUTHORIZED);
      throw new Error(getReasonPhrase(StatusCodes.UNAUTHORIZED));
    }
  }
);

export default protect;

//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiaWF0IjoxNzE1MjQ0NjIxLCJleHAiOjE3MTc4MzY2MjF9.MXa4lT4QvhgBNIbCDKPn590_0B5R-u3QUPGGbrQ0Un4
