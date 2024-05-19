"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMe = exports.changePassword = exports.forgotPasswordConfirmation = exports.forgotPassword = exports.googleSignIn = exports.googleSignUp = exports.loggOut = exports.signUp = exports.signUpDemand = exports.signIn = exports.getMe = exports.refreshAccessToken = exports.deleteExpiredSignUpDemandTokens = exports.generateRefreshToken = exports.generateAuthToken = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_1 = require("http");
const http_status_codes_1 = require("http-status-codes");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const db_1 = __importDefault(require("../../../shared/src/db"));
const capitalize_1 = __importDefault(require("../utils/capitalize"));
const env_1 = __importDefault(require("../utils/env"));
const sendCronResponseEmail_1 = __importDefault(require("../utils/sendCronResponseEmail"));
const generateAuthToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, env_1.default.JWT_SECRET, {
        expiresIn: "15m",
    });
};
exports.generateAuthToken = generateAuthToken;
const generateRefreshToken = async (id) => {
    try {
        const jwtToken = jsonwebtoken_1.default.sign({ id }, env_1.default.JWT_SECRET_REFRESH, {
            expiresIn: "30d",
        });
        await db_1.default.refreshToken.create({
            data: {
                token: jwtToken,
                userId: id,
            },
        });
        return jwtToken;
    }
    catch (error) {
        throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR));
    }
};
exports.generateRefreshToken = generateRefreshToken;
const deleteExpiredSignUpDemandTokens = async () => {
    try {
        const deletedTokens = await db_1.default.signUpDemandToken.deleteMany({
            where: {
                expiredAt: {
                    lte: new Date(),
                },
            },
        });
        (0, sendCronResponseEmail_1.default)(`Sucessfully deleted: ${deletedTokens.count} instances!`);
        return;
    }
    catch (error) {
        (0, sendCronResponseEmail_1.default)(error);
    }
};
exports.deleteExpiredSignUpDemandTokens = deleteExpiredSignUpDemandTokens;
exports.refreshAccessToken = (0, express_async_handler_1.default)(async (req, res) => {
    const { token } = req.body;
    if (!token) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
        throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.default.JWT_SECRET_REFRESH);
        if (!decoded) {
            await db_1.default.refreshToken.deleteMany({
                where: {
                    token,
                },
            });
            res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED);
            throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.UNAUTHORIZED));
        }
        const refreshToken = await db_1.default.refreshToken.findUnique({
            where: {
                token,
            },
        });
        if (!refreshToken) {
            res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED);
            throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.UNAUTHORIZED));
        }
        //? Function that checks if the refresh token is about to expire, and if so - updates the expiredAt DateTime
        if (new Date(refreshToken.expiredAt) <
            new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)) {
            const D30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const updejted = await db_1.default.refreshToken.update({
                where: {
                    id: refreshToken.id,
                },
                data: {
                    expiredAt: D30,
                },
            });
        }
        if (decoded.id !== refreshToken.userId ||
            refreshToken.expiredAt < new Date()) {
            await db_1.default.refreshToken.delete({
                where: {
                    token,
                },
            });
            res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED);
            throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.UNAUTHORIZED));
        }
        const accessToken = (0, exports.generateAuthToken)(refreshToken.userId);
        res.status(200).json(accessToken);
    }
    catch (error) {
        // res.status(StatusCodes.INTERNAL_SERVER_ERROR);
        if (!res.status) {
            res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
        }
        throw (error || new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)));
    }
});
exports.getMe = (0, express_async_handler_1.default)((req, res) => {
    if (!req.user) {
        res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED);
        throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.UNAUTHORIZED));
    }
    res.status(200).json(req.user);
});
exports.signIn = (0, express_async_handler_1.default)(async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
            throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST));
        }
        const user = await db_1.default.user.findFirst({
            where: {
                OR: [{ email: username }, { username: username }],
            },
        });
        if (user &&
            user.password &&
            (await bcryptjs_1.default.compare(password, user.password))) {
            const token = (0, exports.generateAuthToken)(user.id);
            const refreshToken = await (0, exports.generateRefreshToken)(user.id);
            const { password, ...userWithoutPassword } = user;
            req.user = userWithoutPassword;
            res.status(http_status_codes_1.StatusCodes.OK).json({ token, refreshToken });
        }
        else {
            const isPhoneNumber = /^[0-9]+$/;
            if (isPhoneNumber.test(username)) {
                res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
                throw new Error("Format telefonskog broja je +387XxXxxXxx");
            }
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
            throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST));
        }
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
        throw (error || new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)));
    }
});
exports.signUpDemand = (0, express_async_handler_1.default)(async (req, res) => {
    const { password, email, type, username } = req.body;
    if (!username || !type || !email || !password) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
        throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST));
    }
    const emailEquipped = await db_1.default.user.findUnique({
        where: {
            email: email,
        },
    });
    if (emailEquipped) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
        throw new Error("Email is already in use!");
    }
    const usernameEquipped = await db_1.default.user.findUnique({
        where: {
            username,
        },
    });
    if (usernameEquipped) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
        throw new Error("Username equipped!");
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    const hashPassword = await bcryptjs_1.default.hash(password, salt);
    const token = Math.floor(10000 + Math.random() * 90000);
    const signUpDemandToken = await db_1.default.signUpDemandToken.create({
        data: {
            email,
            password: hashPassword,
            type,
            username,
            token,
        },
    });
    try {
        const transporter = nodemailer_1.default.createTransport({
            service: "gmail",
            auth: {
                user: env_1.default.NODEMAILER_AUTH_EMAIL,
                pass: env_1.default.NODEMAILER_AUTH_PWD,
            },
        });
        // await new Promise((resolve, reject) => {
        //   transporter.verify(function (error, success) {
        //     if (error) {
        //       reject(error);
        //     } else {
        //       resolve(success);
        //     }
        //   });
        // });
        const html = `
        <html>
          <body>
            <h4>Hello, ${(0, capitalize_1.default)(username)}!</h4>
            <p>Your verification code is: <b> ${token} </b>.</p>
          </body>
        </html>     
      `;
        const mailOptions = {
            from: env_1.default.NODEMAILER_AUTH_EMAIL,
            to: email,
            subject: "Confirm your account - Ansambl!",
            html: html,
        };
        const sendResult = transporter.sendMail(mailOptions);
        res.status(200).json({ signUpDemandToken: signUpDemandToken.id });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
        // .send({
        //   error: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        // });
        throw new Error("An error occured while sending the email...Please, try again!");
    }
});
exports.signUp = (0, express_async_handler_1.default)(async (req, res) => {
    const { signUpDemandTokenId, signUpDemandTokenValue } = req.body;
    const signUpDemandToken = await db_1.default.signUpDemandToken.findUnique({
        where: {
            id: signUpDemandTokenId,
        },
    });
    if (!signUpDemandTokenId || !signUpDemandTokenValue || !signUpDemandToken) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
        throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST));
    }
    if (signUpDemandToken.expiredAt < new Date()) {
        await db_1.default.signUpDemandToken.delete({
            where: {
                id: signUpDemandToken.id,
            },
        });
        res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED);
        throw new Error("Your token has expired!");
    }
    if (signUpDemandToken.token === signUpDemandTokenValue) {
        const emailEquipped = await db_1.default.user.findUnique({
            where: {
                email: signUpDemandToken.email,
            },
        });
        if (!emailEquipped) {
            try {
                const user = await db_1.default.user.create({
                    data: {
                        email: signUpDemandToken.email,
                        type: signUpDemandToken.type,
                        username: signUpDemandToken.username,
                        password: signUpDemandToken.password,
                    },
                });
                const accessToken = (0, exports.generateAuthToken)(user.id);
                const refreshToken = await (0, exports.generateRefreshToken)(user.id);
                await db_1.default.signUpDemandToken.delete({
                    where: {
                        id: signUpDemandToken.id,
                    },
                });
                res.status(200).json({
                    user,
                    accessToken,
                    refreshToken,
                });
            }
            catch (error) {
                res.json(http_1.STATUS_CODES.INTERNAL_SERVER_ERROR);
                throw new Error((0, http_status_codes_1.getReasonPhrase)(http_1.STATUS_CODES.UNAUTHORIZED || "Unauthorized!"));
            }
        }
        else {
            const updatedUser = await db_1.default.user.update({
                where: {
                    email: signUpDemandToken.email,
                },
                data: {
                    password: signUpDemandToken.password,
                },
            });
            const accessToken = (0, exports.generateAuthToken)(updatedUser.id);
            const refreshToken = await (0, exports.generateRefreshToken)(updatedUser.id);
            await db_1.default.signUpDemandToken.delete({
                where: {
                    id: signUpDemandToken.id,
                },
            });
            res.status(200).json({
                user: updatedUser,
                accessToken,
                refreshToken,
            });
        }
    }
    else {
        res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED);
        throw new Error((0, http_status_codes_1.getReasonPhrase)(http_1.STATUS_CODES.UNAUTHORIZED || "Unauthorized!"));
    }
});
exports.loggOut = (0, express_async_handler_1.default)(async (req, res) => {
    const { token } = req.body;
    try {
        const refreshToken = await db_1.default.refreshToken.delete({
            where: {
                token,
            },
        });
        req.user = undefined;
        res.status(200).json("Logged out!");
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
        throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR));
    }
});
exports.googleSignUp = (0, express_async_handler_1.default)(async (req, res) => {
    const { email, googleId, imageUrl, name, username, type } = req.body;
    if (!name || !username || !email || !googleId || !imageUrl || !type) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
        throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST));
    }
    try {
        const emailEquipped = await db_1.default.user.findUnique({
            where: {
                username,
            },
        });
        if (emailEquipped) {
            res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
            throw new Error("Username equipped!");
        }
        const user = await db_1.default.user.create({
            data: {
                email,
                type,
                username,
                googleId,
                name,
                pfp: imageUrl,
            },
        });
        const { password, ...userWithoutPassword } = user;
        const accessToken = (0, exports.generateAuthToken)(user.id);
        const refreshToken = await (0, exports.generateRefreshToken)(user.id);
        res.status(200).json({
            accessToken,
            refreshToken,
            userWithoutPassword,
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
        throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR));
    }
});
exports.googleSignIn = (0, express_async_handler_1.default)(async (req, res) => {
    const { email, googleId, imageUrl, name } = req.body;
    if (!name || !email || !googleId || !imageUrl) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
        throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST));
    }
    try {
        const userExists = await db_1.default.user.findUnique({
            where: {
                email,
            },
        });
        if (!userExists) {
            res.status(200).json({ exists: false });
            // throw new Error(getReasonPhrase(StatusCodes.BAD_REQUEST))
            return;
        }
        if (userExists && !userExists.googleId) {
            const updated = await db_1.default.user.update({
                where: {
                    email,
                },
                data: {
                    googleId,
                },
            });
            const { password, ...userWithoutPassword } = updated;
            const refreshToken = await (0, exports.generateRefreshToken)(updated.id);
            const accessToken = (0, exports.generateAuthToken)(updated.id);
            res
                .status(200)
                .json({ user: userWithoutPassword, refreshToken, accessToken });
            return;
        }
        else if (userExists && userExists.googleId) {
            const { password, ...userWithoutPassword } = userExists;
            const refreshToken = await (0, exports.generateRefreshToken)(userExists.id);
            const accessToken = (0, exports.generateAuthToken)(userExists.id);
            res
                .status(200)
                .json({ user: userWithoutPassword, refreshToken, accessToken });
            return;
        }
        else {
            res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
            throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR));
        }
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
        throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR));
    }
});
exports.forgotPassword = (0, express_async_handler_1.default)(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
        throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST));
    }
    const user = await db_1.default.user.findUnique({
        where: {
            email,
        },
    });
    if (!user) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
        throw new Error("User does not exists!");
    }
    try {
        const token = Math.floor(10000 + Math.random() * 90000);
        const verifyEmailAddressToken = await db_1.default.verifyEmailAddressToken.create({
            data: {
                token,
                userId: user.id,
            },
        });
        const transporter = nodemailer_1.default.createTransport({
            service: "gmail",
            auth: {
                user: env_1.default.NODEMAILER_AUTH_EMAIL,
                pass: env_1.default.NODEMAILER_AUTH_PWD,
            },
        });
        const html = `
        <html>
          <body>
            <h4>Hello, ${(0, capitalize_1.default)(user.username)}!</h4>
            <p>Confirm your password reset request by entering the code below.</p>
            <p>Your verification code is: <b> ${token} </b>.</p>
          </body>
        </html>     
      `;
        const mailOptions = {
            from: env_1.default.NODEMAILER_AUTH_EMAIL,
            to: email,
            subject: "Password reset request - Ansambl!",
            html: html,
        };
        const sendResult = transporter.sendMail(mailOptions);
        res.status(200).json(verifyEmailAddressToken.id);
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
        throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR));
    }
});
exports.forgotPasswordConfirmation = (0, express_async_handler_1.default)(async (req, res) => {
    const { emailAddressVerificationTokenId, emailAddressVerificationTokenValue, } = req.body;
    if (!emailAddressVerificationTokenId ||
        !emailAddressVerificationTokenValue) {
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
        throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST));
    }
    try {
        const emailAddressVerificationToken = await db_1.default.verifyEmailAddressToken.findUnique({
            where: {
                id: emailAddressVerificationTokenId,
            },
        });
        if (emailAddressVerificationToken &&
            emailAddressVerificationToken.token ===
                emailAddressVerificationTokenValue) {
            const user = await db_1.default.user.findUnique({
                where: {
                    id: emailAddressVerificationToken.userId,
                },
            });
            if (!user) {
                res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
                throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR));
            }
            await db_1.default.verifyEmailAddressToken.delete({
                where: {
                    id: emailAddressVerificationTokenId,
                },
            });
            const accessToken = (0, exports.generateAuthToken)(user.id);
            const refreshToken = await (0, exports.generateRefreshToken)(user.id);
            const { password, ...userWithoutPassword } = user;
            res.status(200).json({
                user: userWithoutPassword,
                accessToken,
                refreshToken,
            });
        }
        else {
            res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED);
            throw new Error("Incorrect code!");
        }
    }
    catch (err) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
        // throw new Error(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
        throw (err || new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)));
    }
});
exports.changePassword = (0, express_async_handler_1.default)(async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || !req.user) {
        console.log("bla");
        res.status(http_status_codes_1.StatusCodes.BAD_REQUEST);
        throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.BAD_REQUEST));
    }
    try {
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashPassword = await bcryptjs_1.default.hash(newPassword, salt);
        await db_1.default.user.update({
            where: {
                id: req.user.id,
            },
            data: {
                password: hashPassword,
            },
        });
        res.status(200).json("ok");
    }
    catch (error) {
        if (!res.status) {
            res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
        }
        throw (error || new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)));
    }
});
exports.deleteMe = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user) {
        res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED);
        throw new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.UNAUTHORIZED));
    }
    try {
        await db_1.default.user.delete({
            where: {
                id: req.user.id,
            },
        });
        res.status(200).json("ok");
    }
    catch (error) {
        if (!res.status) {
            res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
        }
        throw (error || new Error((0, http_status_codes_1.getReasonPhrase)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)));
    }
});
//# sourceMappingURL=auth.js.map