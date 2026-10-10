# 🔍 VeriNexa — Live News & Claim Verification System

**VeriNexa** is an enterprise-grade automated news verification, claim validation, and misinformation detection platform. It ingests direct claims, long-form articles, or news URLs, extracts key factual statements, retrieves real-time global news coverage across multiple APIs, clusters independent reporting, performs deep transformer-based semantic ranking (`MPNet`) and Natural Language Inference stance detection (`DeBERTa-v3`), and fuses evidence into a calibrated binary verdict:

- **`REAL`** (Final Calibrated Trust Score $\ge 0.50$)
- **`FAKE`** (Final Calibrated Trust Score $< 0.50$)

---

## 🌟 Key Features

1. **Multi-Modal Input Ingestion**:
   - **Direct Claim / Headline**: Instant verification of single-sentence claims or viral statements.
   - **Long-Form Text**: Sentence tokenization, entity recognition, and salient claim extraction.
   - **Web Article URL**: Scraping body text, headline, author, domain, and publication date using `BeautifulSoup4`.

2. **Dual-Provider Real-Time News Retrieval**:
   - Automated query generation targeting entities, actions, and locations.
   - Live querying across **NewsAPI** and the **GDELT Project** global monitoring database.
   - Fallback and provider health tracking.

3. **Near-Duplicate Detection & Source Clustering**:
   - Prevents echo chambers and syndicated article bias by grouping near-identical articles.
   - Evaluates source independence across news clusters.

4. **Source Credibility & Reputation Rating**:
   - Domain-level reputation database classifying outlets into High, Medium, Low, or Unverified credibility categories.
   - Penalizes known tabloid/satire sources and boosts wire services (e.g., Reuters, AP, BBC).

5. **Deep Transformer ML Pipeline**:
   - **Semantic Ranking**: `sentence-transformers/all-mpnet-base-v2` dense vector embeddings for contextual relevance scoring.
   - **Natural Language Inference (NLI)**: `cross-encoder/nli-deberta-v3-small` for stance detection (`SUPPORTING`, `CONTRADICTING`, `RELATED`, `INSUFFICIENT`).

6. **Multi-Factor Evidence Fusion Engine**:
   - Mathematical model combining semantic relevance ($30\%$), NLI relation ($30\%$), claim coverage ($15\%$), source quality ($10\%$), recency ($10\%$), and cluster independence ($5\%$).
   - Strict binary decision boundary at $0.50$ without ambiguous outcomes.

7. **Modern Interactive Dashboard**:
   - High-performance UI built with **React 19**, **Vite 8**, **Framer Motion**, and **Lucide Icons**.
   - Real-time system health monitor displaying HuggingFace model readiness and external API provider health.
   - Evidence breakdown cards with stance indicators, source credibility tags, and confidence metrics.

---

## 🛠️ Used Tech Stack

### **Backend Framework & Services**
- **Language**: Python 3.10+
- **API Framework**: FastAPI `0.111.0`
- **ASGI Server**: Uvicorn `0.29.0`
- **Data Validation & Schemas**: Pydantic `2.7.1`
- **HTTP Client**: HTTPX `0.27.0` (Async)
- **HTML Parsing & Web Scraping**: BeautifulSoup4 `4.12.3`

### **Machine Learning & NLP Frameworks**
- **Deep Learning Runtime**: PyTorch `torch==2.3.0`
- **Transformers**: HuggingFace `transformers==4.40.1`
- **Sentence Embeddings**: `sentence-transformers==2.7.0`
- **Semantic Model**: `sentence-transformers/all-mpnet-base-v2` (768-dim embeddings)
- **NLI Stance Model**: `cross-encoder/nli-deberta-v3-small`

### **Frontend Framework & Libraries**
- **UI Core**: React `19.2.8`
- **Build Tool**: Vite `8.3.0`
- **Routing**: React Router DOM `7.18.4`
- **Animations**: Framer Motion `13.4.4`
- **Icons**: Lucide React `1.48.0`
- **CSS / Styling**: Custom CSS tokens & Glassmorphism design system

### **Data Sources & External APIs**
- **NewsAPI.org**: Real-time structured news search API.
- **GDELT Project**: Global Events, Language, and Tone database feed.
- **Source Credibility Database**: JSON-based domain metadata and score mappings.

---

## 📁 Project Structure

```
VeriNexa/
├── README.md                      # Complete system documentation & usage guide
├── PRD.md                         # Product Requirements Document & Technical Specification
├── backend/                       # Python FastAPI Backend
│   ├── main.py                    # FastAPI app entrypoint, routes, and lifespan pipeline
│   ├── config.py                  # Environment settings, scoring weights & threshold values
│   ├── requirements.txt           # Python dependency specifications
│   ├── .env                       # API keys and environment variables
│   ├── data/
│   │   └── source_credibility_db.json # Domain reputation database
│   ├── models/
│   │   └── schemas.py             # Pydantic request/response schemas & data contracts
│   └── services/
│       ├── article_extractor.py   # Web scraping & HTML text extraction service
│       ├── claim_extractor.py     # Claim parsing and entity extraction service
│       ├── duplicate_detector.py  # Near-duplicate clustering & independence engine
│       ├── evidence_fusion.py     # Multi-factor evidence scoring & verdict decision engine
│       ├── evidence_scorer.py     # Feature weighting & article scoring logic
│       ├── news_retriever.py      # Dual NewsAPI & GDELT retrieval service
│       ├── nli_classifier.py      # DeBERTa-v3 cross-encoder NLI classifier service
│       ├── provider_health.py     # Live health tracking for external APIs and ML models
│       ├── query_generator.py     # Automated multi-query synthesis service
│       ├── semantic_ranker.py     # MPNet sentence transformer semantic similarity ranker
│       └── source_credibility.py  # Source credibility evaluation lookup service
│
└── frontend/                      # React 19 + Vite 8 Web Application
    ├── index.html                 # Main HTML entrypoint
    ├── package.json               # Frontend dependencies & npm scripts
    ├── vite.config.js             # Vite configuration
    ├── public/                    # Static public assets
    └── src/
        ├── App.jsx                # Main application component & routes
        ├── main.jsx               # React DOM render entrypoint
        ├── index.css              # Glassmorphism design tokens & global CSS
        ├── components/
        │   └── Layout.jsx         # App navigation header, footer, & container layout
        └── pages/
            ├── Home.jsx           # Landing page with feature showcases
            ├── Verify.jsx         # Verification form (Claim, Text, URL inputs)
            ├── Results.jsx        # Detailed verification output & evidence breakdown
            └── SystemStatus.jsx   # Live system health monitor dashboard
```

---

## 🚀 How to Run the Application

### **Prerequisites**
- **Python 3.10+** (Python 3.11 or 3.12 recommended)
- **Node.js 18+** & **npm**
- **NewsAPI Key** (Free key available at [newsapi.org](https://newsapi.org/))

---

### **Step 1: Running the Backend (FastAPI)**

1. **Open terminal** and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. **Activate the Virtual Environment**:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows (Command Prompt)**:
     ```cmd
     .\venv\Scripts\activate.bat
     ```
   - **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```

   *(Note: If creating a fresh virtual environment from scratch, execute: `python -m venv venv` and `pip install -r requirements.txt`)*

3. **Verify Environment Configuration (`backend/.env`)**:
   Ensure `backend/.env` contains your API credentials:
   ```env
   NEWSAPI_KEY=your_newsapi_key_here
   GDELT_ENABLED=true
   GOOGLE_NEWS_ENABLED=true
   LOG_LEVEL=INFO
   HOST=0.0.0.0
   PORT=8001
   ```

4. **Start the FastAPI Backend Server**:
   ```bash
   python -m uvicorn main:app --reload --port 8001
   ```
   *Alternative directly via uvicorn*:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8001
   ```

   > 💡 **Note**: On initial launch, HuggingFace will automatically download and cache `all-mpnet-base-v2` and `nli-deberta-v3-small` models (~600MB total).

---

### **Step 2: Running the Frontend (React + Vite)**

1. **Open a new terminal window** and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. **Install Node Dependencies** (if first time or updated packages):
   ```bash
   npm install
   ```

3. **Launch Vite Development Server**:
   ```bash
   npm run dev
   ```

4. **Access the Running Application**:
   - 🌐 **Web Dashboard UI**: [http://localhost:5173](http://localhost:5173)
   - 📖 **Swagger API Documentation**: [http://localhost:8001/docs](http://localhost:8001/docs)
   - 💚 **System Status & Health Check**: [http://localhost:8001/api/system/status](http://localhost:8001/api/system/status)

---

## 📡 API Reference & Endpoints

| Method | Endpoint | Description | Payload Sample |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/verify/claim` | Verify short text claim / headline | `{"claim": "NASA successfully lands new rover on Mars."}` |
| `POST` | `/api/verify/text` | Extract claims & verify long text | `{"text": "Full article body paragraph text..."}` |
| `POST` | `/api/verify/url` | Scrape web URL and verify content | `{"url": "https://example.com/news-article"}` |
| `GET` | `/api/system/status` | Retrieve status of models & providers | *None* |
| `GET` | `/docs` | OpenAPI / Interactive Swagger UI | *None* |

---

## ⚙️ Configuration & Weights

Adjust scoring weights and evaluation parameters in `backend/config.py` or directly via environment variables:

```python
SCORING_WEIGHTS = {
    "semantic_relevance": 0.30,  # MPNet similarity score
    "nli_relation": 0.30,        # DeBERTa stance score
    "claim_coverage": 0.15,      # Entity match ratio
    "source_quality": 0.10,      # Domain credibility rank
    "recency": 0.10,             # Article publication freshness
    "independence": 0.05         # Distinct cluster coverage bonus
}
```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.
# VeriNexa
