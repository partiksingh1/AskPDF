import express, { type Request, type Response } from 'express';
import dotenv from "dotenv"
import router from './routes/pdf.js';
import cors from 'cors';

dotenv.config();

export const app = express();
const port = process.env.PORT || 3000; // Change default to 8080 for App Runner

app.use(cors({
    origin: "*"
}));
app.use(express.json());
app.use("/api/v1", router)

app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'AskPDF API is running!', status: 'healthy' });
});

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});