import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import { STATUS_CODES } from "http";
import { StatusCodes, getReasonPhrase } from "http-status-codes";
import jsonwebtoken from "jsonwebtoken";
import nodemailer from "nodemailer";
import { TypedRequestBody } from "zod-express-middleware";
import prisma from "../../../shared/src/db";
import * as authSchemas from "../../../shared/src/schemas/authSchemas";
import capitalizeFirstLetter from "../utils/capitalize";
import env from "../utils/env";
import sendCronResponseEmail from "../utils/sendCronResponseEmail";

export const generateAuthToken = (id: number) => {
  return jsonwebtoken.sign({ id }, env.JWT_SECRET, {
    expiresIn: "5m",
  });
};

export const deleteExpiredSignUpDemandTokens = async () => {
  try {
    console.log("cron started!!!");

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

export const getMe = expressAsyncHandler((req: Request, res: Response) => {
  if (!req.user) {
    res.status(StatusCodes.UNAUTHORIZED);
    throw new Error(getReasonPhrase(StatusCodes.UNAUTHORIZED));
  }

  res.status(200).json(req.user);
});

export const signIn = expressAsyncHandler( 
  async(
    req: TypedRequestBody<typeof authSchemas.signInBody>, 
    res: Response
  ) => {
    try {
      const {
        username, password
      } = req.body

      if (!username || !password) {
        res.status(StatusCodes.BAD_REQUEST);
        throw new Error(getReasonPhrase(StatusCodes.BAD_REQUEST));
      }

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: username },
            { username: username }
          ]
        },
      })

      if (user && user.password && (await bcrypt.compare(password, user.password))) {
        const token = generateAuthToken(user.id);
        const { password, ...userWithoutPassword } = user
        req.user = userWithoutPassword
        res.status(StatusCodes.OK).json({ token })
      } else {
        const isPhoneNumber = /^[0-9]+$/;
        
        if (isPhoneNumber.test(username)) {
          res.status(StatusCodes.BAD_REQUEST); 
          throw new Error("Format telefonskog broja je +387XxXxxXxx");  
        } 

        res.status(StatusCodes.BAD_REQUEST); 
        throw new Error(getReasonPhrase(StatusCodes.BAD_REQUEST));
      }
    } catch (error) {
      console.log(error, '<<<<<<<<')
      res.status(StatusCodes.INTERNAL_SERVER_ERROR);
      throw new Error(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR))
    }
  });

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

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: env.NODEMAILER_AUTH_EMAIL,
          pass: env.NODEMAILER_AUTH_PWD,
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
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR);
      // .send({
      //   error: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
      // });
      throw new Error(
        "An error occured while sending the email...Please, try again!"
      );
    }
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
        try {
          const user = await prisma.user.create({
            data: {
              email: signUpDemandToken.email,
              type: signUpDemandToken.type,
              username: signUpDemandToken.username,
              password: signUpDemandToken.password,
            },
          });

          await prisma.signUpDemandToken.delete({
            where: {
              id: signUpDemandToken.id,
            },
          });

          res.json(user).status(200);
        } catch (error) {
          res.json(STATUS_CODES.INTERNAL_SERVER_ERROR);
          throw new Error(
            getReasonPhrase(
              STATUS_CODES.INTERNAL_SERVER_ERROR || "Unauthorized!"
            )
          );
        }
      } else {
        const updatedUser = await prisma.user.update({
          where: {
            email: signUpDemandToken.email,
          },
          data: {
            password: signUpDemandToken.password,
          },
        });

        await prisma.signUpDemandToken.delete({
          where: {
            id: signUpDemandToken.id,
          },
        });

        res.json(updatedUser);
        // res.json(StatusCodes.UNAUTHORIZED);
        // throw new Error("User with this email already exists");
      }
    } else {
      res.status(StatusCodes.UNAUTHORIZED);
      throw new Error(
        getReasonPhrase(STATUS_CODES.UNAUTHORIZED || "Unauthorized!")
      );
    }
  }
);

export const loggOut = expressAsyncHandler((req, res) => {
  try {
    req.user = undefined;
    res.status(200).json("Logged out!");
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
    throw new Error(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
  }
});
