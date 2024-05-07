import cron from 'node-cron'
import { deleteExpiredSignUpDemandTokens } from 'src/controllers/auth';

const deleteExpiredSignUpDemandTokensCronJob = () => {
    cron.schedule("0 0 * * *", () => {
        deleteExpiredSignUpDemandTokens();
    });
}

export default deleteExpiredSignUpDemandTokensCronJob