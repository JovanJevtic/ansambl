import { NextFunction, Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import jsonwebtoken, { JwtPayload } from "jsonwebtoken";
import prisma from "../../../shared/src/db";
import { UserWithoutPassword } from "../types/express/index";
import env from "../utils/env";
import redis from "../utils/redis";

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

        const cachedUser = await redis.get(`user_${decoded.id}`);
        if (cachedUser) {
          const parsedUser = JSON.parse(cachedUser) as UserWithoutPassword;
          req.user = parsedUser;
          next();
        }

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
            followers: true,
            following: true,
            pfp: true,
            profileDescription: true,
          },
        });

        if (!user) {
          res.status(StatusCodes.UNAUTHORIZED);
          throw new Error(getReasonPhrase(StatusCodes.UNAUTHORIZED));
        }

        req.user = user as UserWithoutPassword;
        await redis.set(
          `user_${decoded.id}`,
          JSON.stringify(user),
          "EX",
          15 * 60
        );

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
