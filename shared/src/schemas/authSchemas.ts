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
    password: z.string().min(1)
  })