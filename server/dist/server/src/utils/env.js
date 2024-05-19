"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    PORT: zod_1.z.number().default(3000),
    NODE_ENV: zod_1.z.enum(["dev", "prod", "test"]).default("dev"),
    NODEMAILER_AUTH_PWD: zod_1.z.string().trim().min(1),
    NODEMAILER_AUTH_EMAIL: zod_1.z.string().trim().min(1),
    JWT_SECRET: zod_1.z.string().trim().min(1),
    JWT_SECRET_REFRESH: zod_1.z.string().trim().min(1),
});
const env = envSchema.parse(process.env);
exports.default = env;
//# sourceMappingURL=env.js.map