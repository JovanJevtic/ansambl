import expressAsyncHandler from "express-async-handler";
import { TypedRequestParams } from "zod-express-middleware-jovan";
import * as usersSchema from "../../../shared/src/schemas/usersSchema";
import prisma from "../../../shared/src/db";
import { Response } from 'express'
import { getReasonPhrase, StatusCodes } from "http-status-codes";
import redisClient from '../utils/redis'
import { UserWithoutPassword } from "../types/express";

export const getUser = expressAsyncHandler(
    async (
        req: TypedRequestParams<typeof usersSchema.getUserParamsSchema>, 
        res: Response
    ) => {
      const username = req.params.username;
      if (req.user && req.user.username === username) {
        res.status(StatusCodes.BAD_REQUEST)
        throw new Error(getReasonPhrase(StatusCodes.BAD_REQUEST))
      }
     
      const cachedUsernameId = await redisClient.get(`user_${username}`)     
      if (cachedUsernameId) {
        const cachedUser = await redisClient.get(`user_${cachedUsernameId}`)
        if (cachedUser) {
          const user = JSON.parse(cachedUser) as UserWithoutPassword;
          const {
            id: aa,
            ...userWithoutId
          } = user
     
          const {
             id: bb,
             adress,
             ...privateUser        
          } = user
          
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
              res.json(userWithoutId).status(StatusCodes.OK);
            } else {
              res.json(privateUser).status(StatusCodes.OK)
            }
          } else {
            res.json(privateUser).status(StatusCodes.OK)
          }
        } 
      } 

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
        res.status(StatusCodes.NOT_FOUND)
        throw new Error("User not found!");
      }

      const {
       id: aa,
       ...userWithoutId
      } = user

      const {
        id: bb,
        adress,
        ...privateUser        
      } = user 

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
          res.json(userWithoutId).status(StatusCodes.OK);
        } else {
          res.json(privateUser).status(StatusCodes.OK)
        }
      } else {
        res.json(privateUser).status(StatusCodes.OK)
      }
  }
)