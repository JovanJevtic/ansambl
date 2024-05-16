import "dotenv/config";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import env from "./utils/env";

import errorHandler from "./middlewares/errorHandler";

import v1 from "./routes/index";
import deleteExpiredSignUpDemandTokensCronJob from "./utils/cronJobs";

const app = express();
app.use(express.json());

app.use(helmet());
app.use(morgan("dev"));

app.use("/api/v1", v1);

app.use(errorHandler);

deleteExpiredSignUpDemandTokensCronJob();

const PORT = 10000 || env.PORT;

app.listen(PORT, () => {
  return console.log(
    `Express server is listening at http://localhost:${PORT} 🚀`
  );
});
