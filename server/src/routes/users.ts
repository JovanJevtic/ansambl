import express, { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import prisma from "../../../shared/src/db";
import { TypedRequest, TypedRequestParams, validateRequest } from "zod-express-middleware-jovan";
import * as usersSchema from "../../../shared/src/schemas/usersSchema";
import * as usersController from '../controllers/users'

const router = express.Router();

//? Get the user info
//! @api/v1/users/${username}
router.get(
  "/:username",
  validateRequest({
    params: usersSchema.getUserParamsSchema
  }),
  usersController.getUser
);

export default router;
