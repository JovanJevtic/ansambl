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
          id: true,
          username: true,
          profileDescription: true,
          name: true,
          adress: true,
          gender: true,
          isPremium: true,
          pfp: true,          
          _count: {
          select: {
            followers: true,
            following: true
            }
          }
        }
      });

      if (!user) {
        res.status(404)
        throw new Error("User not found!");
      }

      if (req?.user) {
        const isFollowing = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: req?.user?.id as number,
              followingId: user.id
            }
          }
        })
        
        if (isFollowing) {
          res.json(user);
        } else {
          const newUser = {
            name: user.name,
            username: user.username,
            profileDescription: user.profileDescription,
            _count: {
              followers: user._count.followers,
              following: user._count.following
            },
            gender: user.gender
          }
          res.json(newUser)  
        }
      } else {
        const newUser = {
          name: user.name,
          username: user.username,
          profileDescription: user.profileDescription,
          _count: {
            followers: user._count.followers,
            following: user._count.following
          },
          gender: user.gender
        }
        res.json(newUser)
      }
  }
)