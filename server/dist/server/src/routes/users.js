"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const db_1 = __importDefault(require("../../../shared/src/db"));
const router = express_1.default.Router();
//? Get the user info
//! @api/v1/users/${username}
router.get("/:username", (0, express_async_handler_1.default)(async (req, res) => {
    const username = req.params.username;
    const user = await db_1.default.user.findUnique({
        where: {
            username,
        },
    });
    if (!user) {
        console.log("bla");
        throw new Error("User not found!");
    }
    res.json(user);
}));
exports.default = router;
//# sourceMappingURL=users.js.map