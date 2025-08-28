
# AskPDF
A smart PDF question-answering application that lets you upload PDF documents and ask questions about their content using AI. Built with React, Express, and Google Gemini AI.
## Demo

Explore the application and chat with your own PDF:

[Open PDF Chatbot](https://askpdf-vlti.onrender.com/)

## Features

- **PDF Upload & Processing** - Upload PDF files and extract text content
- **AI-Powered Q&A** - Ask questions about your PDFs and get intelligent answers
- **Session Management** - Create up to 3 separate chat sessions for different documents
- **Chat History** - Keep track of your conversations with persistent storage
- **Vector Search** - Find relevant content from your documents using embeddings
- **Real-time Interface** - Modern, responsive chat interface with loading states

## Tech Stack

### Frontend (Client)
- React 19 with TypeScript
- Vite for fast development and building
- TailwindCSS for styling
- Axios for API calls
- React Router for navigation
- React Toastify for notifications
- Lucide React for icons

### Backend (Server)
- Express.js with TypeScript
- LangChain for document processing and AI workflows
- Google Gemini AI for text generation and embeddings
- Neon PostgreSQL for vector storage
- Redis for session and chat history management
- Multer for file uploads
- PDF-Parse for PDF text extraction
## 🔄 How It Works

1. **Upload PDF**: The user uploads a PDF document through the interface.

2. **Text Extraction**: The server processes the PDF and extracts its textual content.

3. **Text Chunking**: The extracted text is split into smaller, manageable chunks to optimize processing.

4. **Vector Embeddings**: Each chunk is converted into vector embeddings using **Google AI Embedding APIs**.

5. **Storage**:
   - **PostgreSQL** stores the vector embeddings.  
   - **Redis** manages the real-time chat history and session data.

6. **Question Processing**: User-submitted questions are passed through a **LangChain**-powered workflow.

7. **Context Retrieval**: Relevant chunks are retrieved via **vector similarity search** against the stored embeddings.

8. **Answer Generation**: **Google Gemini** generates a contextual response using the retrieved chunks and chat history.

