import env from "../../server/src/utils/env";
import { PrismaClient } from "../prisma";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (env.NODE_ENV !== "prod") global.prisma = prisma;

export default prisma;
