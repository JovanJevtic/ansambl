import { z } from "zod";
import { Category } from "../../prisma/";

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

const categoryValues = Object.values(Category);

export const updateProfileBody = z
  .object({
    name: z.string().optional(),
    profileDescription: z.string().optional(),
    adress: z.string().array().optional(),
    // interests: z.array(z.enum(categoryValues as [string, ...string[]])),
    interests: z.array(z.nativeEnum(Category)).optional(),
    pfp: z.union([z.string(), z.null()]).optional(),
  })
  .strict();

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

export const changePasswordBody = z
  .object({
    newPassword: z.string().trim().min(8),
  })
  .strict();

export const loggoutBody = z.object({
  token: z.string().trim().min(1),
});
