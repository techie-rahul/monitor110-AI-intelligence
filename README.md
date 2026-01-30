# Monitor110 AI Intelligence Platform  
**Startup Revival Hackathon – FAIL.exe**

Reviving *Monitor110* as an AI-powered, explainable market intelligence platform that converts noisy financial data into credible, confidence-scored insights.

---

## 🚀 What This Project Does

Monitor110 AI analyzes financial information from trusted sources and generates **grounded market intelligence** using GenAI — while actively preventing misinformation and hallucinations.

Unlike traditional sentiment tools, this system:
- Filters low-credibility sources
- Deduplicates noisy content
- Checks query relevance before analysis
- Explains *why* a signal is confident or uncertain

---

## 🧠 Key Features

- **Relevance Guardrail**  
  Prevents analysis when queries fall outside data scope

- **Credibility Scoring**  
  Sources weighted by reliability (official, major publication, analyst)

- **GenAI-Powered Analysis**  
  Uses Groq (LLaMA 3.1) for grounded, explainable insights

- **Explainable Outputs**  
  Sentiment, confidence level, narrative, and key insights

- **Interactive Dashboard**  
  Clean UI with charts, sentiment badges, and source tables

---

## 🧱 Tech Stack

**Backend**
- Node.js
- Express
- Groq SDK (LLaMA 3.1)
- RAG-style pipeline (no vector DB for MVP)

**Frontend**
- React + Vite
- Axios
- Recharts

---

## 📂 Project Structure

monitor110-AI-intelligence/
├── backend/
│ ├── src/
│ │ ├── routes/
│ │ ├── services/
│ │ └── data/
│ └── .env
├── frontend/
│ └── src/
└── README.md


---

## ▶️ How to Run the Project

### Backend
```bash
cd backend
npm install
node src/index.js
Runs at: http://localhost:3001

Frontend
cd frontend
npm install
npm run dev
Runs at: http://localhost:5173

📝 Note
This is a hackathon MVP focused on intelligence quality over market coverage.


---

## ✅ Commit command (final)

```bash
git add README.md
git commit -m "docs: add concise README for hackathon submission"