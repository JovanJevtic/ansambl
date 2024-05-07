import nodemailer from 'nodemailer'

const sendCronResponseEmail = async (error: any) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.NODEMAILER_AUTH_EMAIL,
          pass: process.env.NODEMAILER_AUTH_PWD,
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
      `
    
      const mailOptions = {
        from: process.env.NODEMAILER_AUTH_EMAIL,
        to: "ovojovanovo@gmail.com",
        subject: "Daily Cron Job - Ansambl!",
        html: html
      };
    
    const sendResult = await transporter.sendMail(mailOptions);
      if (sendResult.rejected) {
        console.log("An error ocurred while doing the cron job!");
        return
      }
}

export default sendCronResponseEmail