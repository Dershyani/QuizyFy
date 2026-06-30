# 🧠 QuizyFy

**AI-powered quiz generator for Computer Science students.** Upload your lecture notes as a PDF, and QuizyFy automatically generates multiple-choice questions using a RAG (Retrieval-Augmented Generation) pipeline — then gives you personalized explanations and learning resources when you get something wrong.

---

## ✨ Features

- 📄 **PDF Upload & Processing** — Upload CS lecture notes; text is extracted, cleaned, chunked, and embedded automatically
- 🤖 **AI Quiz Generation** — LLaMA 3 (via Groq) generates 10 MCQs tailored to your notes
- 🔍 **RAG Feedback** — When you answer incorrectly, get an explanation grounded in *your own notes* using SBERT + pgvector semantic search
- 🌐 **Smart Resource Recommendations** — DuckDuckGo search surfaces relevant learning links (GeeksforGeeks, MDN, W3Schools, etc.)
- 🔐 **Authentication** — JWT-based login/register with bcrypt password hashing
- 🛡️ **CS Content Verification** — LLaMA 3 verifies uploaded PDFs are CS-related before processing
- 📊 **Admin Dashboard** — Manage users, documents, and quiz statistics
- 👤 **User Profiles** — Track quiz history and performance

---

## 🏗️ Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| API Framework | FastAPI |
| LLM | LLaMA 3.3-70B via [Groq](https://groq.com) |
| Embeddings | `sentence-transformers` (all-MiniLM-L6-v2) |
| Vector Store | Supabase pgvector |
| Database | Supabase (PostgreSQL) |
| PDF Parsing | pdfplumber |
| Text Chunking | LangChain `RecursiveCharacterTextSplitter` |
| NLP | spaCy (`en_core_web_sm`) |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Web Search | DuckDuckGo Search (`ddgs`) |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite |
| Routing | React Router v7 |
| HTTP | Axios |
| Charts | Recharts |
| Icons | Lucide React |
| Styling | Tailwind CSS v4 |

---

## 📁 Project Structure

```
quizyfy-new-ui/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints/
│   │   │       ├── auth.py          # Login, register endpoints
│   │   │       ├── documents.py     # PDF upload & processing
│   │   │       └── quiz.py          # Quiz generation & submission
│   │   ├── core/
│   │   │   ├── config.py            # Environment settings
│   │   │   └── database.py          # Supabase client
│   │   ├── models/                  # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── auth_service.py      # JWT auth logic
│   │   │   ├── pdf_service.py       # PDF extraction + embedding pipeline
│   │   │   ├── quiz_service.py      # MCQ generation via LLaMA 3
│   │   │   └── rag_service.py       # RAG feedback + recommendations
│   │   └── main.py                  # FastAPI app entry point
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/
        │   ├── Landing.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx
        │   ├── Upload.jsx
        │   ├── Quiz.jsx
        │   ├── Results.jsx
        │   ├── Profile.jsx
        │   ├── AdminDashboard.jsx
        │   └── AdminProfile.jsx
        ├── components/
        ├── services/
        ├── App.jsx
        └── main.jsx
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Supabase](https://supabase.com) project with pgvector enabled
- A [Groq](https://console.groq.com) API key

---

### 1. Clone the Repository

```bash
git clone https://github.com/Dershyani/QuizyFy.git
cd QuizyFy
```

---

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

Create a `.env` file inside the `backend/` directory:

```env
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
SECRET_KEY=your_jwt_secret_key
```

Start the backend server:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## 🔄 How It Works

### PDF → Quiz Pipeline

```
Upload PDF
    │
    ▼
Extract text (pdfplumber)
    │
    ▼
Verify CS content (LLaMA 3)
    │
    ▼
Clean & chunk text (LangChain RecursiveCharacterTextSplitter)
    │
    ▼
Generate SBERT embeddings (all-MiniLM-L6-v2)
    │
    ▼
Store chunks + vectors (Supabase pgvector)
    │
    ▼
Generate MCQs (LLaMA 3.3-70B via Groq)
```

### Wrong Answer → RAG Feedback Pipeline

```
Student answers incorrectly
    │
    ▼
Retrieve relevant chunks (SBERT cosine similarity via pgvector)
    │
    ▼
Generate explanation (LLaMA 3, grounded in student's own notes)
    │
    ▼
Extract topic keywords (LLaMA 3)
    │
    ▼
Search web resources (DuckDuckGo → trusted CS sites)
    │
    ▼
Save recommendations to DB
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login and receive JWT token |
| `POST` | `/documents/upload` | Upload and process a PDF |
| `GET` | `/documents/` | List user's documents |
| `POST` | `/quiz/generate` | Generate a quiz from a document |
| `GET` | `/quiz/{quiz_id}` | Get quiz questions |
| `POST` | `/quiz/submit` | Submit answers and get RAG feedback |
| `GET` | `/health` | Health check |

---

## 🛡️ Environment Variables

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | API key from [Groq Console](https://console.groq.com) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Supabase anon/service key |
| `SECRET_KEY` | Secret key used for JWT signing |

---

## 📦 Supabase Schema (Required Tables)

- `users` — user accounts
- `documents` — uploaded PDF metadata
- `text_chunks` — chunked text + pgvector embeddings (`embedding vector(384)`)
- `quizzes` — generated quiz metadata
- `questions` — individual MCQ questions
- `quiz_attempts` — student quiz sessions
- `answer_attempts` — per-question answers
- `answer_recommendations` — RAG-generated learning links

> **Note:** Enable the `pgvector` extension in Supabase and create a `match_chunks` RPC function for cosine similarity search.

---

## 👥 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "feat: add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is for academic purposes. All rights reserved © 2025 QuizyFy Team.
