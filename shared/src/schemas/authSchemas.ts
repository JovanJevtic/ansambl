import { z } from "zod";

export const signUpDemandBody = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  type: z.enum(["PERSONAL", "ORGANIZATION"]).nullish(),
  email: z.string().email("Not a valid email!").min(1),
});

export const signUpBody = z
  .object({
    signUpDemandTokenId: z.number(),
    signUpDemandTokenValue: z.number(),
  })
  .strict();

export const signInBody = z
  .object({
    username: z.string().min(1),
    password: z.string().min(1),
  })
  .strict();

export const signInGoogleBody = z.object({
  googleId: z.string().trim().min(1),
  email: z.string().email("Not a valid email!").min(1),
  imageUrl: z.string(),
  name: z.string().trim().min(3),
});

export const signUpGoogleBody = z.object({
  googleId: z.string().trim().min(1),
  email: z.string().email("Not a valid email!").min(1),
  imageUrl: z.string(),
  name: z.string().trim().min(3),
  username: z.string().trim().min(3),
  type: z.enum(["PERSONAL", "ORGANIZATION"]).nullish(),
});

export const refreshAccessTokenBody = z
  .object({
    token: z.string().trim().min(1),
  })
  .strict();

export const forgotPasswordBody = z.object({
  email: z.string().email("Not a valid email!").min(1),
});

export const forgotPasswordConfirmationBody = z
  .object({
    emailAddressVerificationTokenId: z.number(),
    emailAddressVerificationTokenValue: z.number(),
  })
  .strict();

export const changePassowrdBody = z
  .object({
    newPassword: z.string().trim().min(8),
  })
  .strict();

export const loggoutBody = z.object({
  token: z.string().trim().min(1),
});
