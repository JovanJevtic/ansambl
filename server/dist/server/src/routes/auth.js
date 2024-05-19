"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const zod_express_middleware_1 = require("zod-express-middleware");
const authSchemas = __importStar(require("../../../shared/src/schemas/authSchemas"));
const authController = __importStar(require("../controllers/auth"));
const authHandler_1 = __importDefault(require("../middlewares/authHandler"));
const router = express_1.default.Router();
/**
 * /api/v1/auth/signup-demand
 * Provide user data required for signup and get the signUpDemandToken and then use it to complete signUp
 *
 * @param { typeof authSchemas.signUpDemandBody } req.body
 * @return {Promise<string>}
 */
router.post("/signup-demand", (0, zod_express_middleware_1.validateRequest)({
    body: authSchemas.signUpDemandBody,
    params: zod_1.z.object({}),
}), authController.signUpDemand);
router.post("/signup", (0, zod_express_middleware_1.validateRequest)({
    body: authSchemas.signUpBody,
}), authController.signUp);
//? Signin
//! @api/v1/auth/signin
//* {  }
router.post("/signin", (0, zod_express_middleware_1.validateRequest)({
    body: authSchemas.signInBody,
}), authController.signIn);
router.post("/refresh-token", (0, zod_express_middleware_1.validateRequest)({
    body: authSchemas.refreshAccessTokenBody,
}), authController.refreshAccessToken);
router.post("/googleSignIn", (0, zod_express_middleware_1.validateRequest)({
    body: authSchemas.signInGoogleBody,
}), authController.googleSignIn);
router.get("/me", authHandler_1.default, authController.getMe);
router.post("/forgot-password", (0, zod_express_middleware_1.validateRequest)({
    body: authSchemas.forgotPasswordBody,
}), authController.forgotPassword);
router.post("/forgot-password-confirmation", (0, zod_express_middleware_1.validateRequest)({
    body: authSchemas.forgotPasswordConfirmationBody,
}), authController.forgotPasswordConfirmation);
router.post("/change-password", authHandler_1.default, (0, zod_express_middleware_1.validateRequest)({
    body: authSchemas.changePassowrdBody,
}), authController.changePassword);
router.post("/loggout", authHandler_1.default, authController.loggOut);
//! Todo: Delete account
router.post("/deleteMe", authHandler_1.default, authController.deleteMe);
//! Todo: Current Sessions (enables users to see where are they logged in)
exports.default = router;
//# sourceMappingURL=auth.js.map