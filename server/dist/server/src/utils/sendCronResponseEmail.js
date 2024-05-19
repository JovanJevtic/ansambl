"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = __importDefault(require("../utils/env"));
const sendCronResponseEmail = async (error) => {
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
            <h4>Hello, Jovan!</h4>
            <p>${error}</p>
          </body>
        </html>     
      `;
    const mailOptions = {
        from: env_1.default.NODEMAILER_AUTH_EMAIL,
        to: "ovojovanovo@gmail.com",
        subject: "Daily Cron Job - Ansambl!",
        html: html,
    };
    const sendResult = await transporter.sendMail(mailOptions);
};
exports.default = sendCronResponseEmail;
//# sourceMappingURL=sendCronResponseEmail.js.map