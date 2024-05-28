import "dotenv/config";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import errorHandler from "./middlewares/errorHandler";
import env from "./utils/env";

import v1 from "./routes/index";

import deleteExpiredSignUpDemandTokensCronJob from "./utils/cronJobs";

const app = express();
app.use(express.json());

app.use(helmet());
app.use(morgan("dev"));

app.use("/api/v1", v1);

import * as https from 'https';

function getPublicIp(retries: number = 3): void {
  https.get('https://ifconfig.co/json', (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
      data += chunk;
    });

    resp.on('end', () => {
      try {
        const jsonResponse = JSON.parse(data);
        console.log(`Your public IP address is: ${jsonResponse.ip}`);
      } catch (error) {
        console.error('Error parsing JSON response:', error);
      }
    });

  }).on("error", (err: any) => {
    if (err.code === 'ECONNRESET' && retries > 0) {
      console.log(`Connection reset by peer, retrying... (${retries} retries left)`);
      getPublicIp(retries - 1);
    } else {
      console.log("Error: " + err.message);
    }
  });
}

getPublicIp();


app.use(errorHandler);

deleteExpiredSignUpDemandTokensCronJob();

const PORT = 10000 || env.PORT;
app.listen(PORT, "0.0.0.0", () => {
  return console.log(
    `Express server is listening at http://localhost:${PORT} 🚀`
  );
});