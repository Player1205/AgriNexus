<div align="center">

  <h1>🌾 AgriNexus</h1>

  <p align="center">
    <strong>"Maximum Backend Complexity, Zero Frontend Friction."</strong>
  </p>

  <p align="center">
    An enterprise-grade, autonomous agricultural platform engineered to eliminate counterfeit farming inputs and diagnose crop pathologies using a zero-trust multi-agent architecture.
  </p>

  <p align="center">
    <a href="https://github.com"><img src="https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge&logo=git&logoColor=white" alt="Version" /></a>
    <a href="https://github.com"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" /></a>
    <a href="https://fastapi.tiangolo.com"><img src="https://img.shields.io/badge/Backend-FastAPI%20%7C%20LangGraph-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="Backend" /></a>
    <a href="https://isocpp.org"><img src="https://img.shields.io/badge/Safety_Engine-C%2B%2B17%20%7C%20pybind11-00599C?style=for-the-badge&logo=cplusplus&logoColor=white" alt="Safety Engine" /></a>
    <a href="https://base.org"><img src="https://img.shields.io/badge/Web3-Base%20Sepolia-0052FF?style=for-the-badge&logo=ethereum&logoColor=white" alt="Web3" /></a>
    <a href="https://react.dev"><img src="https://img.shields.io/badge/Frontend-React%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="Frontend" /></a>
  </p>

  <br />

  <img src="https://via.placeholder.com/800x400/0f172a/6366f1?text=AgriNexus+Control+Room+%26+Field+Telemetry" alt="AgriNexus Architecture Preview" width="100%" />

</div>

---

> **Executive Overview:** AgriNexus bridges multi-agent LLM reasoning with deterministic real-world safety. By sandboxing model outputs through a native C++ compiled safety core, the system guarantees 100% regulatory compliance with ICAR and CIB&RC agricultural standards while recording immutable batch verification on-chain.

---

## 🛠️ Engineering Constraints & Solutions

| Core Challenge | Engineering Solution | Architectural Impact |
| :--- | :--- | :--- |
| **Spurious Inputs** | Computer Vision micro-printing audit via EfficientNet | Blocks counterfeit seed/pesticide distribution before application. |
| **LLM Hallucinations** | Native C++17 mathematical firewall bound via `pybind11` | Overrides hazardous chemical proposals with hardcoded safety thresholds. |
| **Web3 Friction** | Gasless account abstraction on Base Sepolia | Generates cryptographic crop passports without requiring wallet setup. |
| **Accessibility** | Sarvam AI / Edge-TTS audio synthesis pipeline | Converts complex diagnostic reports into regional dialect voice notes. |

---

## 🔄 Dual Telemetry Workflows


```

┌─────────────────────────────────────────┐     ┌─────────────────────────────────────────┐
│     A. Farmer Field Operations          │     │    B. Swarm Control Room Telemetry     │
├─────────────────────────────────────────┤     ├─────────────────────────────────────────┤
│ • Ultra-clean single-tap interaction    │     │ • Real-time node execution graph        │
│ • Crop leaf & package micro-print audit │ ──> │ • Live JSON state & vector search logs  │
│ • Zero-knowledge batch verification     │     │ • C++ safety interlocks & Base hashes   │
│ • Native voice-note diagnostic audio    │     │ • LangGraph orchestration visualization │
└─────────────────────────────────────────┘     └─────────────────────────────────────────┘

```

---

## 🤖 Multi-Agent LangGraph Engine

The state graph orchestrates five isolated agents running sequential validation pipelines:


```

[ Field Image Capture ]
│
▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│     Agent 1      │ ──>  │     Agent 2      │ ──>  │     Agent 3      │
│ Vision Pathology │      │ Grounded RAG     │      │ C++ Safeguard    │
└──────────────────┘      └──────────────────┘      └──────────────────┘
│
┌──────────────────┐                                         │
│     Agent 5      │ <───────────────────────────────────────┘
│ Vernacular Audio │ <──  ┌──────────────────┐
└─────────┬────────┘      │     Agent 4      │
│               │ Base Web3 Ledger │
▼               └──────────────────┘
[ Regional Audio Note ]

```

* **Agent 1 (Vision Pathology):** Analyzes leaf tissue anomalies and package micro-printing authenticity using an EfficientNet vision backbone.
* **Agent 2 (Grounded RAG):** Executes semantic retrieval over a local **ChromaDB** instance containing regional ICAR agricultural guidelines and hyper-local spatial weather data.
* **Agent 3 (C++ Safeguard Engine):** Intercepts RAG payloads and evaluates dosage bounds using a compiled C++ binary via `pybind11` to prevent illegal chemical combinations.
* **Agent 4 (Web3 Crop Passport):** Mint immutable diagnostic dossiers to **Base Sepolia** smart contracts for transparent input provenance.
* **Agent 5 (Vernacular Supervisor):** Synthesizes structural findings into regional dialect audio files via **Sarvam AI Bulbul V3**.

---

## 📂 Monorepo Architecture

```hdfs
agrinexus-monorepo/
├── contracts/             # EVM Smart contracts deployed to Base Sepolia
├── core-safety/           # Hardcoded C++ deterministic mathematical engine
│   ├── src/               # Native C++ logic for dose bounds & safety rules
│   └── bindings.cpp       # pybind11 Python wrapper module
├── server/                # FastAPI Application & LangGraph Engine
│   ├── agents/            # Agents 1-5 execution controllers
│   ├── db/                # ChromaDB vector store bindings
│   └── main.py            # API Gateway & state router
└── web/                   # React + Vite + Tailwind Telemetry Dashboard

```

---

## ⚡ Quick Start

### Prerequisites

* **Python** 3.10+
* **Node.js** v18+
* **C++17 Compiler** (`g++` or `clang`)
* **CMake** 3.16+

### 1. Build Native C++ Core

```bash
cd core-safety
mkdir build && cd build
cmake .. && make

```

### 2. Launch FastAPI Server

```bash
cd ../../server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload

```

### 3. Run Telemetry Workspace

```bash
cd ../web
npm install
npm run dev

```

---