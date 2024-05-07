import { z } from "zod";

const envSchema = z.object({
  DIRECT_URL: z.string().trim().min(1),
  DATABASE_URL: z.string().trim().min(1),
});

const env = envSchema.parse(process.env);
export default env;
