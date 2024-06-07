import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import { STATUS_CODES } from "http";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import jsonwebtoken, { JwtPayload } from "jsonwebtoken";
import nodemailer from "nodemailer";
import { TypedRequestBody } from "zod-express-middleware-jovan";
import prisma from "../../../shared/src/db";
import * as authSchemas from "../../../shared/src/schemas/authSchemas";
import capitalizeFirstLetter from "../utils/capitalize";
import env from "../utils/env";
import redisClient from "../utils/redis";
import sendCronResponseEmail from "../utils/sendCronResponseEmail";

export const generateAuthToken = (id: number) => {
  return jsonwebtoken.sign({ id }, env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = async (id: number) => {
  try {
    const jwtToken = jsonwebtoken.sign({ id }, env.JWT_SECRET_REFRESH, {
      expiresIn: "30d",
    });

    await prisma.refreshToken.create({
      data: {
        token: jwtToken,
        userId: id,
      },
    });

    return jwtToken;
  } catch (error) {
    throw new Error(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

export const deleteExpiredSignUpDemandTokens = async () => {
  if (env.NODE_ENV === "dev" || env.NODE_ENV === "test") {
    return;
  }

  try {
    const deletedTokens = await prisma.signUpDemandToken.deleteMany({
      where: {
        expiredAt: {
          lte: new Date(),
        },
      },
    });

    sendCronResponseEmail(
      `Sucessfully deleted: ${deletedTokens.count} instances!`
    );
    return;
  } catch (error) {
    sendCronResponseEmail(error);
  }
};

export const refreshAccessToken = expressAsyncHandler(
  async (
    req: TypedRequestBody<typeof authSchemas.refreshAccessTokenBody>,
    res: Response
  ) => {
    const { token } = req.body;

    if (!token) {
      res.status(StatusCodes.BAD_REQUEST);
      throw new Error(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    const decoded = jsonwebtoken.verify(
      token,
      env.JWT_SECRET_REFRESH
    ) as JwtPayload;

    if (!decoded) {
      await prisma.refreshToken.deleteMany({
        where: {
          token,
        },
      });

      res.status(StatusCodes.UNAUTHORIZED);
      throw new Error(getReasonPhrase(StatusCodes.UNAUTHORIZED));
    }

    const refreshToken = await prisma.refreshToken.findUnique({
      where: {
        token,
      },
    });

    if (!refreshToken) {
      res.status(StatusCodes.UNAUTHORIZED);
      throw new Error(getReasonPhrase(StatusCodes.UNAUTHORIZED));
    }

    //? Function that checks if the refresh token is about to expire, and if so - updates the expiredAt DateTime
    if (
      new Date(refreshToken.expiredAt) <
      new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
    ) {
      const D30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const updejted = await prisma.refreshToken.update({
        where: {
          id: refreshToken.id,
        },
        data: {
          expiredAt: D30,
        },
      });
    }

    if (
      decoded.id !== refreshToken.userId ||
      refreshToken.expiredAt < new Date()
    ) {
      await prisma.refreshToken.delete({
        where: {
          token,
        },
      });
      res.status(StatusCodes.UNAUTHORIZED);
      throw new Error(getReasonPhrase(StatusCodes.UNAUTHORIZED));
    }

    const accessToken = generateAuthToken(refreshToken.userId);
    res.status(200).json(accessToken);
  }
);

export const getMe = expressAsyncHandler((req: Request, res: Response) => {
  if (!req.user) {
    res.status(StatusCodes.UNAUTHORIZED);
    throw new Error(getReasonPhrase(StatusCodes.UNAUTHORIZED));
  }

  res.status(200).json(req.user);
});

export const signIn = expressAsyncHandler(
  async (
    req: TypedRequestBody<typeof authSchemas.signInBody>,
    res: Response
  ) => {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(StatusCodes.BAD_REQUEST);
      throw new Error(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: username }, { username: username }],
      },
    });

    if (
      user &&
      user.password &&
      (await bcrypt.compare(password, user.password))
    ) {
      const token = generateAuthToken(user.id);
      const refreshToken = await generateRefreshToken(user.id);

      const { password, ...userWithoutPassword } = user;
      req.user = userWithoutPassword;
      res.status(StatusCodes.OK).json({ token, refreshToken });
    } else {
      const isPhoneNumber = /^[0-9]+$/;

      if (isPhoneNumber.test(username)) {
        res.status(StatusCodes.BAD_REQUEST);
        throw new Error("Format telefonskog broja je +387XxXxxXxx");
      }

      res.status(StatusCodes.BAD_REQUEST);
      throw new Error("Invalid credentials!");
    }
  }
);

export const signUpDemand = expressAsyncHandler(
  async (
    req: TypedRequestBody<typeof authSchemas.signUpDemandBody>,
    res: Response
  ) => {
    const { password, email, type, username } = req.body;

    if (!username || !type || !email || !password) {
      res.status(StatusCodes.BAD_REQUEST);
      throw new Error(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    const emailEquipped = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (emailEquipped) {
      res.status(StatusCodes.BAD_REQUEST);
      throw new Error("Email is already in use!");
    }

    const usernameEquipped = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (usernameEquipped) {
      res.status(StatusCodes.BAD_REQUEST);
      throw new Error("Username equipped!");
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const token = Math.floor(10000 + Math.random() * 90000);

    const signUpDemandToken = await prisma.signUpDemandToken.create({
      data: {
        email,
        password: hashPassword,
        type,
        username,
        token,
      },
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.NODEMAILER_AUTH_EMAIL,
        pass: env.NODEMAILER_AUTH_PWD,
      },
    });

    transporter.verify((err, success) => {
      if (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR);
        throw new Error(
          "An error occured while sending the email...Please, try again!"
        );
      }
    });

    const html = `
      <html>
        <body>
          <h4>Hello, ${capitalizeFirstLetter(username)}!</h4>
          <p>Your verification code is: <b> ${token} </b>.</p>
        </body>
      </html>     
    `;

    const mailOptions = {
      from: env.NODEMAILER_AUTH_EMAIL,
      to: email,
      subject: "Confirm your account - Ansambl!",
      html: html,
    };

    const sendResult = transporter.sendMail(mailOptions);
    res.status(200).json({ signUpDemandToken: signUpDemandToken.id });
  }
);

export const signUp = expressAsyncHandler(
  async (
    req: TypedRequestBody<typeof authSchemas.signUpBody>,
    res: Response
  ) => {
    const { signUpDemandTokenId, signUpDemandTokenValue } = req.body;

    const signUpDemandToken = await prisma.signUpDemandToken.findUnique({
      where: {
        id: signUpDemandTokenId,
      },
    });

    if (!signUpDemandTokenId || !signUpDemandTokenValue || !signUpDemandToken) {
      res.status(StatusCodes.BAD_REQUEST);
      throw new Error(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    if (signUpDemandToken.expiredAt < new Date()) {
      await prisma.signUpDemandToken.delete({
        where: {
          id: signUpDemandToken.id,
        },
      });
      res.status(StatusCodes.UNAUTHORIZED);
      throw new Error("Your token has expired!");
    }

    if (signUpDemandToken.token === signUpDemandTokenValue) {
      const emailEquipped = await prisma.user.findUnique({
        where: {
          email: signUpDemandToken.email,
        },
      });

      if (!emailEquipped) {
        const user = await prisma.user.create({
          data: {
            email: signUpDemandToken.email,
            type: signUpDemandToken.type,
            username: signUpDemandToken.username,
            password: signUpDemandToken.password,
          },
        });

        const accessToken = generateAuthToken(user.id);
        const refreshToken = await generateRefreshToken(user.id);

        await prisma.signUpDemandToken.delete({
          where: {
            id: signUpDemandToken.id,
          },
        });

        res.status(200).json({
          user,
          accessToken,
          refreshToken,
        });
      } else {
        const updatedUser = await prisma.user.update({
          where: {
            email: signUpDemandToken.email,
          },
          data: {
            password: signUpDemandToken.password,
          },
        });

        const accessToken = generateAuthToken(updatedUser.id);
        const refreshToken = await generateRefreshToken(updatedUser.id);

        await prisma.signUpDemandToken.delete({
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
    } else {
      res.status(StatusCodes.UNAUTHORIZED);
      throw new Error(
        getReasonPhrase(STATUS_CODES.UNAUTHORIZED || "Unauthorized!")
      );
    }
  }
);

export const loggOut = expressAsyncHandler(
  async (req: TypedRequestBody<typeof authSchemas.loggoutBody>, res) => {
    const { token } = req.body;

    const refreshToken = await prisma.refreshToken.delete({
      where: {
        token,
      },
    });

    req.user = undefined;
    res.status(200).json("Logged out!");
  }
);

export const googleSignUp = expressAsyncHandler(
  async (
    req: TypedRequestBody<typeof authSchemas.signUpGoogleBody>,
    res: Response
  ) => {
    const { email, googleId, imageUrl, name, username, type } = req.body;

    if (!name || !username || !email || !googleId || !imageUrl || !type) {
      res.status(StatusCodes.BAD_REQUEST);
      throw new Error(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    const emailEquipped = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (emailEquipped) {
      res.status(StatusCodes.BAD_REQUEST);
      throw new Error("Username equipped!");
    }

    const user = await prisma.user.create({
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

    const accessToken = generateAuthToken(user.id);
    const refreshToken = await generateRefreshToken(user.id);

    res.status(200).json({
      accessToken,
      refreshToken,
      userWithoutPassword,
    });
  }
);

export const googleSignIn = expressAsyncHandler(
  async (
    req: TypedRequestBody<typeof authSchemas.signInGoogleBody>,
    res: Response
  ) => {
    const { email, googleId, imageUrl, name } = req.body;

    if (!name || !email || !googleId || !imageUrl) {
      res.status(StatusCodes.BAD_REQUEST);
      throw new Error(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    const userExists = await prisma.user.findUnique({
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
      const updated = await prisma.user.update({
        where: {
          email,
        },
        data: {
          googleId,
        },
      });

      const { password, ...userWithoutPassword } = updated;
      const refreshToken = await generateRefreshToken(updated.id);
      const accessToken = generateAuthToken(updated.id);

      res
        .status(200)
        .json({ user: userWithoutPassword, refreshToken, accessToken });
      return;
    } else if (userExists && userExists.googleId) {
      const { password, ...userWithoutPassword } = userExists;
      const refreshToken = await generateRefreshToken(userExists.id);
      const accessToken = generateAuthToken(userExists.id);

      res
        .status(200)
        .json({ user: userWithoutPassword, refreshToken, accessToken });
      return;
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR);
      throw new Error(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    }
  }
);

export const forgotPassword = expressAsyncHandler(
  async (
    req: TypedRequestBody<typeof authSchemas.forgotPasswordBody>,
    res: Response
  ) => {
    const { email } = req.body;

    if (!email) {
      res.status(StatusCodes.BAD_REQUEST);
      throw new Error(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      res.status(StatusCodes.BAD_REQUEST);
      throw new Error("User does not exists!");
    }

    const token = Math.floor(10000 + Math.random() * 90000);

    const verifyEmailAddressToken = await prisma.verifyEmailAddressToken.create(
      {
        data: {
          token,
          userId: user.id,
        },
      }
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.NODEMAILER_AUTH_EMAIL,
        pass: env.NODEMAILER_AUTH_PWD,
      },
    });

    transporter.verify((err, success) => {
      if (err) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR);
        throw new Error("An error ocurred while sanding the email!");
      }
    });

    const html = `
        <html>
          <body>
            <h4>Hello, ${capitalizeFirstLetter(user.username)}!</h4>
            <p>Confirm your password reset request by entering the code below.</p>
            <p>Your verification code is: <b> ${token} </b>.</p>
          </body>
        </html>     
      `;

    const mailOptions = {
      from: env.NODEMAILER_AUTH_EMAIL,
      to: email,
      subject: "Password reset request - Ansambl!",
      html: html,
    };

    const sendResult = transporter.sendMail(mailOptions);
    res.status(200).json(verifyEmailAddressToken.id);
  }
);

export const forgotPasswordConfirmation = expressAsyncHandler(
  async (
    req: TypedRequestBody<typeof authSchemas.forgotPasswordConfirmationBody>,
    res: Response
  ) => {
    const {
      emailAddressVerificationTokenId,
      emailAddressVerificationTokenValue,
    } = req.body;

    if (
      !emailAddressVerificationTokenId ||
      !emailAddressVerificationTokenValue
    ) {
      res.status(StatusCodes.BAD_REQUEST);
      throw new Error(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    const emailAddressVerificationToken =
      await prisma.verifyEmailAddressToken.findUnique({
        where: {
          id: emailAddressVerificationTokenId,
        },
      });

    if (
      emailAddressVerificationToken &&
      emailAddressVerificationToken.token === emailAddressVerificationTokenValue
    ) {
      const user = await prisma.user.findUnique({
        where: {
          id: emailAddressVerificationToken.userId,
        },
      });

      if (!user) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR);
        throw new Error(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
      }

      await prisma.verifyEmailAddressToken.delete({
        where: {
          id: emailAddressVerificationTokenId,
        },
      });

      const accessToken = generateAuthToken(user.id);
      const refreshToken = await generateRefreshToken(user.id);

      const { password, ...userWithoutPassword } = user;

      res.status(200).json({
        user: userWithoutPassword,
        accessToken,
        refreshToken,
      });
    } else {
      res.status(StatusCodes.UNAUTHORIZED);
      throw new Error("Incorrect code!");
    }
  }
);

export const changePassword = expressAsyncHandler(
  async (
    req: TypedRequestBody<typeof authSchemas.changePasswordBody>,
    res: Response
  ) => {
    const { newPassword } = req.body;

    if (!newPassword || !req.user) {
      res.status(StatusCodes.BAD_REQUEST);
      throw new Error(getReasonPhrase(StatusCodes.BAD_REQUEST));
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        password: hashPassword,
      },
    });

    res.status(200).json("ok");
  }
);

export const updateProfile = expressAsyncHandler(
  async (
    req: TypedRequestBody<typeof authSchemas.updateProfileBody>,
    res: Response
  ) => {
    if (!req.user) {
      res.status(StatusCodes.UNAUTHORIZED);
      throw new Error("Unauthorized");
    }

    const updateData = req.body;
    const { adress, interests, name, pfp, profileDescription } = req.body;

    if (!adress && !interests && !name && !pfp && !profileDescription) {
      res.status(200).json(req.user);
      return;
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        ...updateData,
      },
    });

    await redisClient.set(
      `user_${req.user.id}`,
      JSON.stringify(updatedUser),
      "EX",
      15 * 60
    );
    res.status(StatusCodes.OK).json(updatedUser);
  }
);

export const deleteMe = expressAsyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(StatusCodes.UNAUTHORIZED);
    throw new Error(getReasonPhrase(StatusCodes.UNAUTHORIZED));
  }

  await prisma.user.delete({
    where: {
      id: req.user.id,
    },
  });
  res.status(200).json("ok");
});
