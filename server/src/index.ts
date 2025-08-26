import express, { type Request, type Response } from 'express';
import dotenv from "dotenv"
import router from './routes/pdf.js';
import cors from 'cors';
dotenv.config();
export const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api/v1", router)
app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

