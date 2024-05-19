"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = __importDefault(require("./utils/env"));
const errorHandler_1 = __importDefault(require("./middlewares/errorHandler"));
const index_1 = __importDefault(require("./routes/index"));
const cronJobs_1 = __importDefault(require("./utils/cronJobs"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use("/api/v1", index_1.default);
app.use(errorHandler_1.default);
(0, cronJobs_1.default)();
const PORT = 3000 || env_1.default.PORT;
app.listen(PORT, "0.0.0.0", () => {
    return console.log(`Express server is listening at http://localhost:${PORT} 🚀`);
});
//# sourceMappingURL=index.js.map