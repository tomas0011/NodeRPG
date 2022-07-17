"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = express_1.default();
const port = 3001;
app.use(cors_1.default());
app.use((req, res, next) => {
    console.log('URL: ', req.url);
    next();
});
app.get('/command', (req, res) => {
    return res.status(200).send({
        command: req.query.command,
        content: req.query.command
    });
});
app.listen(port, () => {
    console.log(`[server]: Server is running at https://localhost:${port}`);
});
//# sourceMappingURL=index.js.map