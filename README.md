```markdown
<div align="center">

  <img src="https://via.placeholder.com/800x200?text=AgriNexus+Autonomous+Platform" alt="AgriNexus Banner" width="100%" />

  <br /><br />

  <img src="https://img.shields.io/badge/Version-1.0.0--release-blue?style=for-the-badge&logo=git" alt="Version" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/Backend-FastAPI%20%7C%20LangGraph-009688?style=for-the-badge&logo=fastapi" alt="Backend" />
  <img src="https://img.shields.io/badge/Safety_Engine-C%2B%2B17%20%7C%20pybind11-00599C?style=for-the-badge&logo=cplusplus" alt="Safety Engine" />
  <img src="https://img.shields.io/badge/Web3-Base%20Sepolia-0052FF?style=for-the-badge&logo=ethereum" alt="Web3" />
  <img src="https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20Tailwind-61DAFB?style=for-the-badge&logo=react" alt="Frontend" />

  <h1>AgriNexus</h1>

  <h3><em>"Maximum Backend Complexity, Zero Frontend Friction."</em></h3>

  <p align="center">
    An enterprise-grade, autonomous agricultural engine built to eliminate counterfeit farming inputs (seeds/pesticides) and diagnose crop pathologies deterministically using a zero-trust multi-agent architecture.
  </p>

</div>

---

> **TL;DR:** AgriNexus bridges the gap between sophisticated multi-agent AI and seamless field application. It sandboxes LLM outputs through a native C++ safety firewall to eliminate hallucinations, enforces regulatory compliance (ICAR/CIB&RC), and anchors verified crop diagnostics on-chain—all delivered to the farmer via localized voice notes.

---

## 🌾 Real-World Problems Solved

* **The Counterfeit Input Crisis:** Eradicates spurious seeds and unregulated pesticides that drive rural financial distress. Aligns strictly with verification frameworks specified in the *Draft Seeds Bill* and *Pesticides Management Bill*.
* **AI Hallucination & Safety Hazards:** Eliminates dangerous or illegal chemical recommendation risks. Standard LLM outputs are sandboxed and intercepted by a compiled, deterministic safety layer to guarantee compliance with **ICAR** and **CIB&RC** parameters.
* **The Accessibility Barrier:** Removes Web3 friction (gas fees, seed phrases) and language barriers. The complex multi-agent execution pipeline collapses down to a single image upload and local audio output.

---

## 🔄 System Architecture & Workflows

AgriNexus operates a synchronized dual-interface workflow designed for field execution and live administrative oversight.


```

┌─────────────────────────────────────────┐     ┌─────────────────────────────────────────┐
│     A. Farmer-Facing Interface          │     │    B. Swarm Telemetry Control Room     │
├─────────────────────────────────────────┤     ├─────────────────────────────────────────┤
│ • Ultra-clean, single-tap interaction   │     │ • Dark-mode real-time node graph        │
│ • Upload package or diseased leaf image │ ──> │ • Live JSON payloads & execution timers │
│ • Instant visual verification           │     │ • C++ safety logs & Base contract hashes│
│ • Localized voice note diagnosis        │     │ • Powered by LangGraph state machine    │
└─────────────────────────────────────────┘     └─────────────────────────────────────────┘

```

---

## 🤖 The 5-Agent LangGraph Orchestration Engine

Data is routed through five specialized, sequence-driven agents bound by a central state machine:


```

[ Farmer Image Input ]
│
▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│     Agent 1      │ ──>  │     Agent 2      │ ──>  │     Agent 3      │
│  Vision / CNN    │      │   Grounded RAG   │      │   C++ Safeguard  │
└──────────────────┘      └──────────────────┘      └──────────────────┘
│
┌──────────────────┐                                         │
│     Agent 5      │ <───────────────────────────────────────┘
│  Voice Synthesis │ <──  ┌──────────────────┐
└─────────┬────────┘      │     Agent 4      │
│               │  Web3 Passport   │
▼               └──────────────────┘
[ Native Audio Out ]

```

* **Agent 1: Vision Pathology & Package Inspection:** Leverages an EfficientNet model to detect package micro-printing anomalies (counterfeit screening) or classify leaf pathogens (e.g., *Wheat Stripe Rust*).
* **Agent 2: Grounded RAG & Spatial Agronomy:** Queries a local **ChromaDB** vector store populated with official **ICAR** guidelines, cross-referencing real-time spatial weather parameters.
* **Agent 3: Deterministic C++ Safety Engine:** Intercepts proposed treatments and passes payloads into a compiled C++ binary via `pybind11`. Blocks restricted compounds and calculates strict per-acre chemical-to-water ratios.
* **Agent 4: Web3 Crop Passport:** Generates an immutable, cryptographically signed dossier and writes the state to a **Base Sepolia** smart contract via account abstraction (gasless for the end user).
* **Agent 5: Vernacular Supervisor & Voice Synthesis:** Converts structured diagnostic output into regional dialects (e.g., Punjabi, Hindi) using **Sarvam AI Bulbul V3 / Edge-TTS**.

---

## ⚙️ Hardware & Technical Specifications

| Component | Technology Stack | Core Function |
| :--- | :--- | :--- |
| **Orchestration** | LangGraph / FastAPI | Asynchronous multi-agent state graph execution |
| **Deterministic Layer** | C++17 / pybind11 | Sub-millisecond hazard interception & dose calculations |
| **Vector Engine** | ChromaDB | Local RAG grounding against regulatory ag-binders |
| **Blockchain** | Base Sepolia (EVM) | Immutable cryptographic batch verification & provenance |
| **Voice / Speech** | Sarvam AI / Edge-TTS | Regional dialect translation and speech synthesis |
| **Frontend UI** | React / Tailwind CSS | Dual-view workspace (Field UX & System Telemetry) |

---

## 📂 Repository Structure

```hdfs
agrinexus-monorepo/
├── contracts/             # Solidity smart contracts for Base Sepolia Crop Passports
├── core-safety/           # Hardcoded C++ deterministic mathematical engine
│   ├── CMakeLists.txt     # Build specifications
│   ├── src/               # Native C++ logic for dose bounds & safety rules
│   └── bindings.cpp       # pybind11 Python wrapper module
├── server/                # FastAPI Application & LangGraph Orchestration Engine
│   ├── agents/            # Isolated agent controllers (Agents 1-5)
│   ├── db/                # Vector store setup & ChromaDB integrations
│   └── main.py            # API gateway & state machine router
└── web/                   # Vite + React + Tailwind Frontend (Farmer/Admin Telemetry)

```

---

## ⚡ Setup & Deployment Guide

### Prerequisites

* **Python:** v3.10 or higher
* **Node.js:** v18 or higher
* **C++ Compiler:** `g++` (v9+) or `clang` (v11+) supporting C++17
* **Build Tools:** `cmake` (v3.16+)

---

### 1. Compile the C++ Safety Core

```bash
cd core-safety
mkdir build && cd build
cmake ..
make

```

*This compiles the shared object file (`.so`/`.pyd`) for high-speed Python bindings.*

---

### 2. Configure & Launch the FastAPI Server

```bash
cd ../../server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

```

---

### 3. Initialize the Frontend Telemetry Dashboard

```bash
cd ../web
npm install
npm run dev

```

---

## 🛡️ Zero-Trust Security Model

* **Hard-Compiled Matrix Protection:** Adversarial prompt injections cannot bypass safety thresholds because logic execution is enforced within the native C++ binary post-LLM generation.
* **Immutable Provenance:** Batch signatures and diagnostic reports are anchored directly to Base Sepolia, establishing a transparent audit chain from manufacturer to rural application.

---