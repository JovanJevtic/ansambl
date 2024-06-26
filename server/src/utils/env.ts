import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["dev", "prod", "test"]).default("dev"),
  NODEMAILER_AUTH_PWD: z.string().trim().min(1),
  NODEMAILER_AUTH_EMAIL: z.string().trim().min(1),
  JWT_SECRET: z.string().trim().min(1),
  JWT_SECRET_REFRESH: z.string().trim().min(1),
  REDIS_URL: z.string().trim().min(1),
  REDIS_PWD: z.string().trim().min(1),
  REDIS_IP: z.string().trim().min(1)
});

const env = envSchema.parse(process.env);
export default env;
