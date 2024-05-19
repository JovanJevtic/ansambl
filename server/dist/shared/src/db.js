"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const env_1 = __importDefault(require("../../server/src/utils/env"));
const prisma_1 = require("../prisma");
exports.prisma = global.prisma || new prisma_1.PrismaClient();
if (env_1.default.NODE_ENV !== "prod")
    global.prisma = exports.prisma;
exports.default = exports.prisma;
//# sourceMappingURL=db.js.map