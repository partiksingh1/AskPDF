import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

export const loadPdfContent = async (filePath: string) => {
    try {
        const loader = new PDFLoader(filePath);
        const docs = await loader.load();
        return docs;
    } catch (err) {
        throw new Error("Failed to load PDF content.");
    }
};
