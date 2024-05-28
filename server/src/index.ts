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

export const getPublicIp = (retries: number = 3): void => {
  const options = {
    timeout: 5000 // 5 seconds timeout
  };

  const req = https.get('https://api.ipify.org?format=json', options, (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
      data += chunk;
    });

    resp.on('end', () => {
      try {
        // Provera sadržaja odgovora~
        if (resp.headers['content-type']?.includes('application/json')) {
          const jsonResponse = JSON.parse(data);
          console.log(`Your public IP address is: ${jsonResponse.ip}`);
        } else {
          console.error('Unexpected response format:', data);
        }
      } catch (error) {
        console.error('Error parsing JSON response:', error);
      }
    });
  });

  req.on("error", (err: any) => {
    if (err.code === 'ECONNRESET' && retries > 0) {
      console.log(`Connection reset by peer, retrying... (${retries} retries left)`);
      getPublicIp(retries - 1);
    } else {
      console.log("Error: " + err.message);
    }
  });

  req.on('timeout', () => {
    req.abort();
    console.log('Request timed out');
  });
}
app.use(errorHandler);

deleteExpiredSignUpDemandTokensCronJob();

const PORT = 10000 || env.PORT;
app.listen(PORT, "0.0.0.0", () => {
  return console.log(
    `Express server is listening at http://localhost:${PORT} 🚀`
  );
});