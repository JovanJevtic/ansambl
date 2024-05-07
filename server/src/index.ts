import "dotenv/config";
import express from "express";
import helmet from "helmet";
import env from "./utils/env";

import errorHandler from "./middlewares/errorHandler";

import v1 from "./routes/index";
import deleteExpiredSignUpDemandTokensCronJob from "./utils/cronJobs";

const app = express();
app.use(express.json());

app.use(helmet());

app.use("/api/v1", v1);

app.use(errorHandler);

deleteExpiredSignUpDemandTokensCronJob();

const PORT = 3000 || env.PORT;

app.listen(PORT, () => {
  return console.log(
    `Express server is listening at http://localhost:${PORT} 🚀`
  );
});
