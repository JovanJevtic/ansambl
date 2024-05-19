"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_status_codes_1 = require("http-status-codes");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../../../shared/src/db"));
const env_1 = __importDefault(require("../utils/env"));
const protect = (0, express_async_handler_1.default)(async (req, res, next) => {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jsonwebtoken_1.default.verify(token, env_1.default.JWT_SECRET);
            const user = await db_1.default.user.findUnique({
                where: { id: decoded.id },
                select: {
                    password: false,
                    phone: true,
                    adress: true,
                    birthday: true,
                    email: true,
                    gender: true,
                    googleId: true,
                    id: true,
                    interests: true,
                    isPremium: true,
                    name: true,
                    role: true,
                    type: true,
                    username: true,
                },
            });
            if (!user) {
                res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED);
                throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.UNAUTHORIZED));
            }
            req.user = user;
            next();
        }
        catch (error) {
            res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED);
            throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.UNAUTHORIZED));
        }
    }
    else {
        res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED);
        throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.UNAUTHORIZED));
    }
});
exports.default = protect;
//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwiaWF0IjoxNzE1MjQ0NjIxLCJleHAiOjE3MTc4MzY2MjF9.MXa4lT4QvhgBNIbCDKPn590_0B5R-u3QUPGGbrQ0Un4
//# sourceMappingURL=authHandler.js.map