"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggoutBody = exports.changePassowrdBody = exports.forgotPasswordConfirmationBody = exports.forgotPasswordBody = exports.refreshAccessTokenBody = exports.signUpGoogleBody = exports.signInGoogleBody = exports.signInBody = exports.signUpBody = exports.signUpDemandBody = void 0;
const zod_1 = require("zod");
exports.signUpDemandBody = zod_1.z.object({
    username: zod_1.z.string().min(3),
    password: zod_1.z.string().min(8),
    type: zod_1.z.enum(["PERSONAL", "ORGANIZATION"]).nullish(),
    email: zod_1.z.string().email("Not a valid email!").min(1),
});
exports.signUpBody = zod_1.z
    .object({
    signUpDemandTokenId: zod_1.z.number(),
    signUpDemandTokenValue: zod_1.z.number(),
})
    .strict();
exports.signInBody = zod_1.z
    .object({
    username: zod_1.z.string().min(1),
    password: zod_1.z.string().min(1),
})
    .strict();
exports.signInGoogleBody = zod_1.z.object({
    googleId: zod_1.z.string().trim().min(1),
    email: zod_1.z.string().email("Not a valid email!").min(1),
    imageUrl: zod_1.z.string(),
    name: zod_1.z.string().trim().min(3),
});
exports.signUpGoogleBody = zod_1.z.object({
    googleId: zod_1.z.string().trim().min(1),
    email: zod_1.z.string().email("Not a valid email!").min(1),
    imageUrl: zod_1.z.string(),
    name: zod_1.z.string().trim().min(3),
    username: zod_1.z.string().trim().min(3),
    type: zod_1.z.enum(["PERSONAL", "ORGANIZATION"]).nullish(),
});
exports.refreshAccessTokenBody = zod_1.z
    .object({
    token: zod_1.z.string().trim().min(1),
})
    .strict();
exports.forgotPasswordBody = zod_1.z.object({
    email: zod_1.z.string().email("Not a valid email!").min(1),
});
exports.forgotPasswordConfirmationBody = zod_1.z
    .object({
    emailAddressVerificationTokenId: zod_1.z.number(),
    emailAddressVerificationTokenValue: zod_1.z.number(),
})
    .strict();
exports.changePassowrdBody = zod_1.z
    .object({
    newPassword: zod_1.z.string().trim().min(8),
})
    .strict();
exports.loggoutBody = zod_1.z.object({
    token: zod_1.z.string().trim().min(1),
});
//# sourceMappingURL=authSchemas.js.map