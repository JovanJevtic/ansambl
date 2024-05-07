import express from "express";
import helmet from "helmet";

require("dotenv").config();

import errorHandler from "./middlewares/errorHandler";

import v1 from "./routes/index";
import deleteExpiredSignUpDemandTokensCronJob from "./utils/cronJobs";

const app = express();
app.use(express.json());

app.use(helmet());

app.use("/api/v1", v1);

app.use(errorHandler);

deleteExpiredSignUpDemandTokensCronJob()

const PORT = 3000 || process.env.PORT;

app.listen(PORT, () => {
  return console.log(
    `Express server is listening at http://localhost:${PORT} 🚀`
  );
});
