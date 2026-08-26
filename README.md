<div align="center">

  <h1>🌾 AgriNexus</h1>

  <p align="center">
    <strong>Autonomous Agricultural Verification & Pathology Intelligence Engine</strong>
  </p>

  <p align="center">
    An enterprise-grade, zero-trust platform engineered to eliminate counterfeit farming inputs and diagnose crop pathologies—delivering instant, localized audio guidance directly to farmers without technological friction.
  </p>

  <p align="center">
    <a href="https://github.com"><img src="https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge&logo=git&logoColor=white" alt="Version" /></a>
    <a href="https://github.com"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" /></a>
    <a href="https://fastapi.tiangolo.com"><img src="https://img.shields.io/badge/Backend-FastAPI%20%7C%20LangGraph-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="Backend" /></a>
    <a href="https://isocpp.org"><img src="https://img.shields.io/badge/Safety_Engine-C%2B%2B17%20%7C%20pybind11-00599C?style=for-the-badge&logo=cplusplus&logoColor=white" alt="Safety Engine" /></a>
    <a href="https://base.org"><img src="https://img.shields.io/badge/Web3-Base%20Sepolia-0052FF?style=for-the-badge&logo=ethereum&logoColor=white" alt="Web3" /></a>
    <a href="https://react.dev"><img src="https://img.shields.io/badge/Frontend-React%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="Frontend" /></a>
  </p>

</div>

---

> **TL;DR:** AgriNexus operates on a simple principle: **Maximum Backend Complexity, Zero Frontend Friction.** A farmer simply takes a photo of a crop leaf or seed package. In response, the system returns a plain-language audio note in their native regional dialect detailing the exact diagnosis and safety instructions. Behind the scenes, five AI agents, a deterministic C++ safety core, and an immutable blockchain ledger handle all validation seamlessly.

---

## 💡 What is AgriNexus? (Plain English Summary)

Rural farmers frequently face two major threats:
1. **Fake Agricultural Inputs:** Spurious seeds and adulterated pesticides that destroy crop yields and cause severe financial strain.
2. **Dangerous AI Advice:** Generic AI chatbots that "hallucinate" incorrect chemical dosages, leading to ruined soil or illegal chemical usage.

**AgriNexus solves both problems effortlessly.**

### The Farmer Experience: Zero Technical Overhead
The end user requires **no knowledge of blockchain, AI, or complex software**. They do not manage crypto wallets, pay gas fees, read dense technical manuals, or navigate multi-step forms.


```

[ 1. Snap Photo ] ──> [ 2. Tap Upload ] ──> [ 3. Listen to Regional Audio ]

```

1. **Snap a Picture:** The farmer uploads an image of a diseased leaf or a pesticide package label.
2. **Automated Verification:** AgriNexus processes the image through an advanced AI and hardcoded safety network.
3. **Instant Audio Output:** The farmer receives a spoken voice message in their regional dialect (e.g., Hindi, Punjabi) explaining exactly what is wrong, whether the input is genuine, and precisely how much water to mix with the treatment.

---

## 🛠️ Engineering Constraints & Solutions

To make the user experience completely effortless, the underlying system handles immense structural complexity:

| Engineering Constraint | Technical Solution | System Impact |
| :--- | :--- | :--- |
| **Counterfeit Seed/Pesticide Trade** | Micro-printing analysis via EfficientNet vision model | Detects packaging anomalies before counterfeit chemicals hit the field. |
| **LLM Safety & Hallucinations** | Native C++17 decision firewall bound via `pybind11` | Intercepts AI proposals to enforce strict, hardcoded ICAR / CIB&RC safety limits. |
| **Blockchain Complexity** | Gasless account abstraction on Base Sepolia | Automatically anchors immutable audit records on-chain without requiring user wallets. |
| **Literacy & Language Barriers** | Sarvam AI Bulbul V3 / Edge-TTS audio pipeline | Translates structural diagnostic data into clear, natural voice notes in local dialects. |

---

## 🔄 Dual Telemetry Workflows

AgriNexus balances hyper-simple field operations with comprehensive system-wide monitoring:


```

┌─────────────────────────────────────────┐     ┌─────────────────────────────────────────┐
│     A. Farmer Field Workspace           │     │   B. Swarm Control Room Telemetry       │
├─────────────────────────────────────────┤     ├─────────────────────────────────────────┤
│ • Single-tap image submission           │     │ • Real-time node execution graph        │
│ • Automatic batch verification          │ ──> │ • Vector search logs & state state-machine│
│ • Zero wallet setup or gas fees         │     │ • C++ safety interlocks & Base hashes   │
│ • Localized voice note diagnosis        │     │ • LangGraph multi-agent execution telemetry│
└─────────────────────────────────────────┘     └─────────────────────────────────────────┘

```

---

## 🤖 The 5-Agent LangGraph Engine

When an image is submitted, it flows through five synchronized, specialized agents bound by a central state machine:


```

[ Field Image Input ]
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
[ Regional Audio Output ]

```

1. **Agent 1 (Vision Pathology & Inspection):** Analyzes leaf tissue anomalies and screens package micro-printing for counterfeit markers using an EfficientNet backbone.
2. **Agent 2 (Grounded RAG & Agronomy):** Executes semantic searches over a local **ChromaDB** vector store containing official ICAR guidelines, combining them with local weather data.
3. **Agent 3 (C++ Safeguard Engine):** Intercepts proposed treatments and passes them into a compiled C++ binary via `pybind11`. It enforces mathematical safety boundaries for chemical mixing ratios, overriding any AI errors.
4. **Agent 4 (Web3 Crop Passport):** Mints a cryptographically signed batch dossier to **Base Sepolia** smart contracts, maintaining transparent input history without user intervention.
5. **Agent 5 (Vernacular Audio Supervisor):** Converts verified diagnostics into natural dialect speech via **Sarvam AI Bulbul V3** / **Edge-TTS**.

---

## 🔒 Security & Mathematical Safety

To prevent dangerous chemical recommendations, AgriNexus routes AI suggestions through a hardcoded C++ compiled binary. The mathematical evaluation for water-to-chemical ratios enforces strict linear bounds:

$$\text{Safe Dosage } (D) = \min \left( D_{\text{RAG}}, \frac{C_{\text{max}} \times A}{\text{Dilution Factor}} \right)$$

Where $C_{\text{max}}$ is the maximum allowable active ingredient per acre ($A$) under CIB&RC regulatory standards. If $D_{\text{RAG}} > D$, the C++ layer automatically overrides the LLM output and enforces $D$.

---

## 📂 Repository Structure

```hdfs
agrinexus-monorepo/
├── contracts/             # EVM Smart contracts deployed on Base Sepolia
├── core-safety/           # Hardcoded C++ deterministic mathematical safety layer
│   ├── src/               # Native C++ logic for dose bounds & safety rules
│   └── bindings.cpp       # pybind11 Python wrapper module
├── server/                # FastAPI Application & LangGraph Orchestration State Machine
│   ├── agents/            # Isolated agent execution modules (Agents 1-5)
│   ├── db/                # Vector store setup (ChromaDB)
│   └── main.py            # API gateway & state machine router
└── web/                   # Vite + React + Tailwind Frontend (Dual Workspace)

```

---

## ⚡ Quick Start & Setup Guide

### Prerequisites

* **Python:** v3.10+
* **Node.js:** v18+
* **C++ Compiler:** `g++` (v9+) or `clang` (v11+) supporting C++17
* **CMake:** v3.16+

---

### 1. Compile the C++ Safety Core

```bash
cd core-safety
mkdir build && cd build
cmake ..
make

```

### 2. Configure & Launch the Backend Server

```bash
cd ../../server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

```

### 3. Start the Frontend Telemetry Interface

```bash
cd ../web
npm install
npm run dev

```

---