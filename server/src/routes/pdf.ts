import express from "express";
import { clear_chat_history, delete_session, get_chat_history, search, upload_pdf } from "../controller/document.js";
import { upload } from "../middleware/uploaderMiddleware.js";

const router = express.Router();

router.post("/upload-pdf", upload.single("pdfFile"), upload_pdf);
router.post("/search", search)
router.get('/history/:sessionId', get_chat_history);
router.delete('/history/:sessionId', clear_chat_history);
router.delete("/session/:sessionId", delete_session);


export default router;