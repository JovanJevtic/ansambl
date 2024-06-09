import express, { Request, Response } from "express";
import { validateRequest } from "zod-express-middleware-jovan";
import * as usersSchema from "../../../shared/src/schemas/usersSchema";
import * as usersController from '../controllers/users'
import userhandler from '../middlewares/userHandler'

const router = express.Router();

//? Get the user info
//! @api/v1/users/${username}
router.get(
  "/:username",
  userhandler,
  validateRequest({
    params: usersSchema.getUserParamsSchema
  }),
  usersController.getUser
);

export default router;
