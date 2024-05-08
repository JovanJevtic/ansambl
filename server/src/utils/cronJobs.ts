import cron from "node-cron";
import { deleteExpiredSignUpDemandTokens } from "../controllers/auth";

const deleteExpiredSignUpDemandTokensCronJob = () => {
  cron.schedule(
    "0 */12 * * *",
    () => {
      deleteExpiredSignUpDemandTokens();
    },
    {
      timezone: "Europe/Sarajevo",
      scheduled: true,
    }
  );
};

export default deleteExpiredSignUpDemandTokensCronJob;
