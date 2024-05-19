"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const auth_1 = require("../controllers/auth");
const deleteExpiredSignUpDemandTokensCronJob = () => {
    node_cron_1.default.schedule("0 */12 * * *", () => {
        (0, auth_1.deleteExpiredSignUpDemandTokens)();
    }, {
        timezone: "Europe/Sarajevo",
        scheduled: true,
    });
};
exports.default = deleteExpiredSignUpDemandTokensCronJob;
//# sourceMappingURL=cronJobs.js.map