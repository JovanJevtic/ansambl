import express from "express";

import { z } from "zod";
import { validateRequest } from "zod-express-middleware-jovan";
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
router.post(
  "/signin",
  validateRequest({
    body: authSchemas.signInBody,
  }),
  authController.signIn
);

router.post(
  "/refresh-token",
  validateRequest({
    body: authSchemas.refreshAccessTokenBody,
  }),
  authController.refreshAccessToken
);

router.post(
  "/googleSignUp",
  validateRequest({
    body: authSchemas.signUpGoogleBody,
  }),
  authController.googleSignUp
);

router.post(
  "/googleSignIn",
  validateRequest({
    body: authSchemas.signInGoogleBody,
  }),
  authController.googleSignIn
);

router.get("/me", protect, authController.getMe);

router.post(
  "/forgot-password",
  validateRequest({
    body: authSchemas.forgotPasswordBody,
  }),
  authController.forgotPassword
);

router.post(
  "/forgot-password-confirmation",
  validateRequest({
    body: authSchemas.forgotPasswordConfirmationBody,
  }),
  authController.forgotPasswordConfirmation
);

router.post(
  "/change-password",
  protect,
  validateRequest({
    body: authSchemas.changePasswordBody,
  }),
  authController.changePassword
);

router.post(
  "/update",
  protect,
  validateRequest({
    body: authSchemas.updateProfileBody,
  }),
  authController.updateProfile
);

router.post(
  "/loggout",
  protect,
  validateRequest({
    body: authSchemas.loggoutBody,
  }),
  authController.loggOut
);

//! Todo:
//!    limiting - brute force protection,
//!    rate limit reset password,
//!    secondary recovery email,
//!    forcet loggout when reseting password
//!    change email
//!    alret when accessing from unexpected locations

//! Todo: Delete account
router.post("/deleteMe", protect, authController.deleteMe);

//! Todo: Current Sessions (enables users to see where are they logged in)

export default router;
