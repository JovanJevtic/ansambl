import { User } from "../../../../shared/prisma";

type UserWithoutPassword = Omit<User, "password">;
// declare module "express" {
//   export interface Request {
//     user?: UserWithoutPassword;
//   }
// }


declare global {
  namespace Express {
    interface Request {
      user?: UserWithoutPassword;
    }
  }
}
