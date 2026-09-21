# AgriNexus 🌾

> **Empowering Rural Agriculture with Unbiased Edge AI, Web3 Transparency, and Zero-Hallucination Agronomy.**

AgriNexus is a production-grade, AI-powered agricultural intelligence platform designed to bring institutional-grade crop diagnostics to offline rural edge devices. It strictly enforces a zero-hallucination policy by grounding all chemical recommendations in verified **ICAR (Indian Council of Agricultural Research)** protocols.

---

## 🌟 Key Features

- **Hybrid Vision AI Engine:** 
  - **Tier 1 (Edge):** Sub-millisecond on-device execution using an optimized ONNX (EfficientNet-B4) model. 
  - **Tier 2 (Cloud):** Gemini Vision AI fallback for out-of-distribution (OOD) anomalies.
- **Zero-Hallucination RAG (ChromaDB):** 
  - Never guesses pesticide dosages. All treatments are fetched dynamically from a locally hosted vector database of certified ICAR protocols.
- **Web3 Immutable Passports (Base Sepolia):**
  - Every diagnostic scan is hashed and minted to the blockchain to create immutable crop passports, enabling verifiable crop insurance claims and preventing corporate bias.
- **Vernacular Voice Synthesis (Sarvam AI):**
  - High-fidelity text-to-speech translates complex agronomy into native Hindi audio (`Bulbul:v3`), overcoming rural literacy barriers.
- **Professional Diagnostic Reports:**
  - Dynamic PDF generation with Cloudinary image embeddings, exact safe-to-spray metrics, and localized Krishi Vigyan Kendra (KVK) referrals.
- **Admin Dashboard & Telemetry:**
  - Full visibility into platform usage, scan history, and user management via a secure React Admin dashboard.

---

## 🏗️ System Architecture

AgriNexus uses a micro-monolith architecture orchestrated via LangGraph multi-agent state graphs.

- **Frontend:** React 18, Vite, Tailwind CSS, jsPDF, Axios. (Deployed on Vercel)
- **Backend:** Python 3.12, FastAPI, LangGraph, MongoDB Atlas, ChromaDB, Cloudinary. (Deployed on Render)
- **Smart Contracts:** Solidity 0.8.20 on Base Sepolia.
- **Edge AI:** ONNX Runtime & Numpy.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- Python 3.12+
- MongoDB Atlas Cluster
- API Keys: Gemini, Sarvam AI, Cloudinary

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Create a `.env` file in `/backend`:**
```env
# Security
SECRET_KEY=your_secure_secret_key

# Databases
MONGODB_URI=mongodb+srv://<user>:<password>@cluster...

# AI & Voice
GOOGLE_API_KEY=your_gemini_key
SARVAM_API_KEY=your_sarvam_key

# Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Run the Backend:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

**Create a `.env` file in `/frontend`:**
```env
VITE_API_URL=http://localhost:8000
```

**Run the Frontend:**
```bash
npm run dev
```

---

## 🛡️ Strategic Vision & Business Model
AgriNexus is built for **B2G (Business-to-Government)** deployment. By acting as an unbiased, ICAR-compliant oracle, it serves as a critical infrastructure layer for state agriculture departments and KVKs. 

Instead of taking biased pesticide brand deals, AgriNexus monetizes via **Generic Diagnosis + Sponsored Fulfillment**. The AI neutral-diagnoses the required chemical, while regional verified sellers optionally sponsor the local fulfillment marketplace. Furthermore, aggregate immutable disease heatmaps are monetized for crop insurance underwriting.

---
*Built with ❤️ for global food security.*
