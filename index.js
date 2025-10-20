import express, { response } from "express";
const app = express();
const PORT = process.env.PORT || 16078;

import cors from "cors";
import { loadBackendAMG } from './src/backend/index-AMG.js';
import { handler } from './src/frontend/build/handler.js'

app.use(express.json());
app.use(cors());

loadBackendAMG(app);

app.use(handler);
app.listen(PORT, () => {
    console.log(`Server running on ${PORT}!`);
});