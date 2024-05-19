"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = __importDefault(require("../utils/env"));
const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;
    res.status(statusCode).json({
        message: err.message,
        stack: (env_1.default.NODE_ENV || "").trim() === "dev" ? err.stack : null,
    });
};
exports.default = errorHandler;
//# sourceMappingURL=errorHandler.js.map