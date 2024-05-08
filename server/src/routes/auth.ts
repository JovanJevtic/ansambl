import express from "express";

import { z } from "zod";
import { validateRequest } from "zod-express-middleware";
import * as authSchemas from "../../../shared/src/schemas/authSchemas";
import * as authController from "../controllers/auth";
import protect from "../middlewares/authHandler";

const router = express.Router();

/**
 * /api/v1/auth/signup-demand
 * Provide user data required for signup and get the signUpDemandToken and then use it to complete signUp
 *
 * @param { typeof authSchemas.signUpDemandBody } req.body
 * @return {Promise<string>}
 */
router.post(
  "/signup-demand",
  validateRequest({
    body: authSchemas.signUpDemandBody,
    params: z.object({}),
  }),
  authController.signUpDemand
);

router.post(
  "/signup",
  validateRequest({
    body: authSchemas.signUpBody,
  }),
  authController.signUp
);

//? Signin
//! @api/v1/auth/signin
//* {  }
router.post("/signin", 
  validateRequest({
    body: authSchemas.signInBody
  }),
  authController.signIn
);

router.post("/refresh-token",
  validateRequest({
    body: authSchemas.refreshAccessTokenBody
  }),
  authController.refreshAccessToken
)

//? Get the user
//! @api/v1/auth/me
//*
router.get("/me", protect, authController.getMe);

router.get("/loggout", protect, authController.loggOut);

export default router;