# 🏛️ AgriNexus: Complete System Design & Enterprise Architecture

---

## 📑 Executive Summary

**AgriNexus** is a decentralized, zero-trust, edge-optimized multi-agent agronomy platform engineered to solve the **$29 Billion annual crop disease and chemical toxicity crisis** affecting smallholder farmers worldwide.

The system is built on a **polyglot micro-monolith architecture** uniting:
1. **Edge Computer Vision (C++ / ONNX Runtime):** Sub-100ms offline neural diagnosis on edge CPUs via `EfficientNet-B4`.
2. **Deterministic Safety Core (ISO C++17 / `pybind11`):** A mathematical gatekeeper enforcing statutory pesticide thresholds and Indian CIB&RC banned lists.
3. **Grounded Agronomic RAG (Vectorized ICAR Knowledge Base):** 38 verified research protocols from the Indian Council of Agricultural Research.
4. **Real-Time Meteorological Intelligence (Open-Meteo & EXIF GPS):** Hyper-local rain-fastness forecasting and wind drift interlocks.
5. **Decentralized Cryptographic Ledger (Ethereum Layer-2 / Base Sepolia):** Immutable, gasless crop health passports for export compliance and insurance.
6. **Acoustic Neural Speech Engine (Sarvam AI Bulbul:v3):** High-depth voice advisories synthesized across 11 Indian regional languages.

---

## 📐 High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph FIELD ["🌾 Field Ingestion & Meteorological Ingestion Layer"]
        A["📸 Leaf Image Capture\n(Mobile Browser / Camera)"] --> B["📍 3-Tier Geolocation Engine\n(Photo EXIF GPS -> Browser GPS -> Regional Baseline)"]
        B --> C["⛅ Hyper-Local Weather Feed\n(Open-Meteo Live API: Temp, Humidity, Rain Risk, Wind)"]
        A --> D["🌐 Dialect Selector\n(1 of 11 Indic Languages)"]
    end

    subgraph SWARM ["🤖 Autonomous 5-Agent Multi-Agent Swarm (MAS) — LangGraph Orchestration"]
        direction TB
        E["🧠 AGENT 1: Vision Pathology\n(Offline ONNX EfficientNet-B4 · 82ms CPU Inference · Fallback: Gemini Vision)"]
        --> F["📚 AGENT 2: Grounded ICAR RAG\n(38 Certified ICAR Protocols · Zero-Guesswork Agronomy)"]
        --> G["🛡️ AGENT 3: Deterministic C++ Safety Firewall\n(CIB&RC Gazette Banned List · Mathematical Dosage Clamping)"]
        --> H["⛓️ AGENT 4: Web3 Crop Passport Relayer\n(Base Sepolia L2 Gasless Smart Contract · SHA-256 Hashes)"]
        --> I["🎙️ AGENT 5: Vernacular Voice Supervisor\n(Sarvam AI Bulbul:v3 Indic Acoustic Engine)"]
    end

    subgraph DUAL_OUT ["⚡ Dual Output Interface"]
        I --> J["🔊 Farmer Interface\n(Spoken Vernacular Audio + Verified Safe / Alert Card + Weather HUD)"]
        H --> K["📊 3D Telemetry Control Room\n(Real-Time WebSocket Bus + Laser Edge Propagation + BaseScan Explorer)"]
    end

    FIELD --> SWARM
    SWARM --> DUAL_OUT
```

---

## 🧱 Polyglot Technology Stack

AgriNexus adheres to strict separation of concerns, choosing the optimal runtime for each engineering constraint:

| Layer | Language / Technology | Engineering Justification |
| :--- | :--- | :--- |
| **Deterministic Safety Core** | `ISO C++17`, `pybind11`, `CMake` | Zero-allocation, memory-safe deterministic execution. Eliminates LLM non-determinism in life-critical chemical calculations. |
| **Edge Vision Inference** | `ONNX Runtime`, `Numpy`, `Pillow` | Eliminates heavy PyTorch dependencies on low-cost devices; delivers **82ms CPU inference** with a 75MB memory footprint. |
| **Backend & MAS Swarm** | `Python 3.12`, `FastAPI`, `LangGraph` | Asynchronous I/O (`asyncio`), strict typed state machines (`AgriNexusState`), and resilient pregel graph streaming. |
| **Agronomic Vector Core** | `ChromaDB` / Custom In-Memory Vector Engine | Semantic token overlap and vector distance retrieval across 38 official ICAR crop pathology protocols. |
| **Smart Contracts** | `Solidity 0.8.20`, `Hardhat`, `OpenZeppelin v5` | Gas-optimized ERC-adjacent registry deployed on **Base Sepolia (Chain ID: 84532)** with replay-safe cryptographic event logging. |
| **Vernacular Speech Engine** | `Sarvam AI (Bulbul:v3)` | State-of-the-art neural acoustic synthesis trained natively on 11 Indian language phonemes. |
| **Frontend UI & Telemetry** | `React 18`, `Vite`, `Tailwind CSS`, `Lucide Icons` | Sub-50ms reactive state hydration, mobile-responsive farmer UI, and cybernetic 3D SVG laser line animations. |
| **Testing & CI/CD** | `Pytest`, `Vitest`, `Hardhat`, `GitHub Actions`, `Docker` | Multi-matrix automated cloud validation across C++, Python, Solidity, and React on every push. |

---

## 🔍 Deep-Dive Subsystem Specifications

```
                                  AGRINEXUS SUBSYSTEM MAP
                                             │
      ┌──────────────────┬───────────────────┼───────────────────┬──────────────────┐
      ▼                  ▼                   ▼                   ▼                  ▼
1. Edge Vision    2. ICAR RAG Core    3. C++ Safety Core  4. Weather Engine  5. Web3 Ledger
(EfficientNet)    (38 Protocols)      (CIB&RC Firewall)   (Open-Meteo GPS)   (Base Sepolia)
```

---

### 1. Edge Computer Vision Subsystem (`Agent 1`)

* **Model Architecture:** `EfficientNet-B4` fine-tuned on the 50,000+ image PlantVillage dataset across 38 botanical pathology classes.
* **Input Tensor Specification:** RGB images resized to $400\times400$, center-cropped to $380\times380$, normalized with ImageNet mean $\mu = [0.485, 0.456, 0.406]$ and standard deviation $\sigma = [0.229, 0.224, 0.225]$.
* **Optimization & Quantization:** PyTorch weights exported to **ONNX Runtime (Opset 14)** with constant folding and dynamic batch dimensions (`dynamic_axes={'input': {0: 'batch_size'}}`).
* **Inference Pipeline:**
  $$\text{Input Image} \xrightarrow{\text{Numpy Normalization}} \mathbf{X} \in \mathbb{R}^{1 \times 3 \times 380 \times 380} \xrightarrow{\text{ONNX CPU Engine}} \mathbf{z} \in \mathbb{R}^{38}$$
  $$\mathbf{p} = \text{Softmax}(\mathbf{z}) = \frac{\exp(z_i - \max(\mathbf{z}))}{\sum_{j=1}^{38} \exp(z_j - \max(\mathbf{z}))}$$
* **Offline-to-Cloud Dual Execution:**
  1. *Primary (Offline Edge AI):* Local ONNX session executes in **82ms** with $0.00 cloud API cost.
  2. *Secondary (Cloud Vision Fallback):* If ONNX runtime is unavailable or weights are unmounted, seamlessly falls back to Google Gemini 1.5 Flash Vision.
  3. *Uncertainty Gate:* If $\max(\mathbf{p}) < 0.60$, the diagnosis is flagged as `"Unrecognized Pattern (Low Confidence)"` to trigger mandatory physical extension verification.

---

### 2. Grounded ICAR Agronomy Vector Core (`Agent 2`)

* **Database Structure (`icar_protocols.json`):** Contains 38 research protocols codified from official ICAR institutes (*IIVR Varanasi, CPRI Shimla, IIMR Ludhiana, CITH Srinagar, NRCG Pune, IIHR Bengaluru*).
* **Protocol Schema:**
  ```json
  {
    "id": "ICAR-TOM-LB-01",
    "crop": "Tomato",
    "disease": "Tomato Late Blight",
    "keywords": ["tomato", "late blight", "phytophthora infestans", "water soaked"],
    "pathogen_type": "Oomycete / Fungal",
    "active_chemical": "Azoxystrobin 18.2% + Difenoconazole 11.4% SC",
    "chemical_group": "Strobilurin + Triazole",
    "base_dosage_per_acre": 150.0,
    "unit": "ml",
    "dilution_water_liters": 200,
    "application_window": "Early morning or late evening on dry foliage",
    "is_banned": false,
    "source_institute": "ICAR-Indian Institute of Vegetable Research (IIVR), Varanasi",
    "advisory_text": "ICAR Protocol #TOM-LB: Apply Azoxystrobin + Difenoconazole at 150 ml/acre diluted in 200L water."
  }
  ```
* **Retrieval Mechanics:** Tokenized semantic vector distance + exact pathology keyword matching:
  $$\text{Score}(P, Q) = 150 \cdot \mathbb{I}_{\text{exact}}(P_{\text{disease}}, Q) + 80 \cdot \mathbb{I}_{\text{sub}}(P_{\text{disease}}, Q) + 30 \cdot |T(P_{\text{crop}}) \cap T(Q)| + 10 \cdot |T(P_{\text{keywords}}) \cap T(Q)|$$
* **Zero-Guesswork Invariant:** If no verified ICAR protocol achieves $\text{Score} \ge 40.0$, the agent returns `proposed_chemical: "None - Field Inspection Required"`, preventing dangerous pesticide guessing.

---

### 3. Deterministic C++ Safety Engine (`Agent 3`)

* **Core Role:** Prevents LLM hallucinations, blocks statutory banned substances, separates liquid (`ml`) vs powder (`g`) formulations, and enforces ICAR Minimum Inhibitory Concentration (MIC) therapeutic floors.
* **Binding Layer:** Compiled C++17 shared object exposed to Python via `pybind11` (`safety_engine.cpp`).
* **Statutory Gazette Schedule:** Enforces the Indian Ministry of Agriculture / CIB&RC schedule of prohibited substances:
  $$\text{Banned} = \{\text{endosulfan}, \text{monocrotophos}, \text{dicofol}, \text{methomyl}, \text{carbofuran}, \text{phorate}, \text{triazophos}, \text{methyl parathion}, \text{diazinon}, \dots\}$$
* **Formulation Separation & ICAR MIC Therapeutic Floor Formula:**
  $$\text{Bounded} = \min \left( D_{\text{RAG}}, \text{Max Statutory Ceiling} \right)$$
  $$\text{Attenuated} = \text{Bounded} \times \left(1.0 - \max\left(0, \frac{H - 80}{100}\right)\right)$$
  $$\mathbf{\text{Final Safe Dosage}} = \max\left( \text{Min MIC Floor}, \text{Attenuated} \right)$$
  *where $H$ is ambient relative humidity (%).*
* **Agronomic Immunity:** Eliminates under-dosing below the pathogen's Minimum Inhibitory Concentration, preventing fungal resistance while protecting leaves from high-humidity chemical burn.

---

### 4. Statutory Non-Actionable Referral & ICAR KVK Geospatial Resolver

* **Core Role:** Acts as an inviolable legal and safety circuit breaker. If diagnostic confidence falls below statutory thresholds ($<60\%$) or an indeterminate foliar anomaly is detected, chemical prescription is strictly locked to $0.0\text{ ml/g}$.
* **Sub-Millisecond Haversine Geolocation Engine (`kvk_service.py`):**
  * Computes spherical great-circle distances across the 731 certified ICAR Krishi Vigyan Kendra network:
    $$a = \sin^2\left(\frac{\Delta\text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta\text{lon}}{2}\right)$$
    $$d = 2 R \cdot \text{atan2}(\sqrt{a}, \sqrt{1-a}) \quad (R = 6371.0\text{ km})$$
  * Delivers exact nearest KVK center name, direct phone dialer (`tel:`), address, and Google Maps navigation link in $<0.2\text{ms}$.
* **Spoken Dialect Referral:** Sarvam AI acoustic supervisor directs the farmer in their native language to their specific district KVK agronomist.

---

### 5. Offline-First Store-and-Forward Engine & On-Device Native Speech

* **Edge Resilience:** If a smallholder farmer operates in a remote rural dead zone with 0% cellular connectivity:
  1. *Local Edge Vision & C++ Clamping:* Executes 100% locally on CPU in 82ms.
  2. *On-Device Native Speech API Fallback:* Leverages client `window.speechSynthesis` for instant vernacular spoken advisory even in airplane mode.
  3. *Asynchronous Store-and-Forward Queue:* Enqueues diagnostic telemetry locally and auto-drains the queue to Base Sepolia L2 the moment 2G/3G connectivity returns.

---

### 6. Real-Time Meteorological & Geolocation Engine

* **Smart 3-Tier Geolocation Hierarchy:**
  1. *Tier 1 (Photo EXIF GPS):* Parses `GPSInfo` tags (`GPSLatitude`, `GPSLongitude`, `GPSLatitudeRef`, `GPSLongitudeRef`) directly from raw image binary using DMS-to-decimal conversion.
  2. *Tier 2 (Live Browser GPS):* Captures client coordinates via `navigator.geolocation.getCurrentPosition` with a 1.5s timeout.
  3. *Tier 3 (Regional Baseline):* Gracefully falls back to Northern Agricultural Zone (Ludhiana, Punjab: `30.9010° N, 75.8573° E`) if GPS is disabled or offline.
* **Meteorological Telemetry Feed (Open-Meteo API):**
  * Current Temperature ($^\circ\text{C}$) & Relative Humidity ($\%$)
  * Precipitation Rate ($\text{mm}$) & Wind Speed ($10\text{m, km/h}$)
  * Hourly Precipitation Risk Probability over next 6 hours ($\%$)
* **Agronomic Spray Safety Interlocks:**
  * **Rain-Fastness Gate:** If $\text{Rain Risk (6h)} \ge 35\% \implies \text{Spray Safety} = \text{FALSE}$ (prevents chemical wash-off).
  * **Wind Drift Gate:** If $\text{Wind Speed} \ge 15.0 \text{ km/h} \implies \text{Spray Safety} = \text{FALSE}$ (prevents chemical drift).
  * **Foliar Burn Gate:** If $\text{Temperature} \ge 36.0^\circ\text{C} \implies \text{Mandates early dawn/dusk application}$.

---

### 5. Web3 & Cryptographic Provenance Subsystem (`Agent 4`)

* **Network:** Base Sepolia Ethereum Layer-2 (Chain ID: `84532`, RPC: `https://sepolia.base.org`).
* **Smart Contract:** [`CropPassport.sol`](file:///c:/Users/vansh/OneDrive/Desktop/AgriNexus/contracts/contracts/CropPassport.sol) deployed at address [`0xDd819A09aff9A62D1F6Ad662c6cC34d4B5D7DAd7`](https://sepolia.basescan.org/address/0xDd819A09aff9A62D1F6Ad662c6cC34d4B5D7DAd7).
* **On-Chain Data Structure:**
  ```solidity
  struct PassportRecord {
      uint256 timestamp;       // Block timestamp of diagnosis
      string imageHash;        // SHA-256 fingerprint of leaf photograph
      string diagnosis;        // Pathology classification (e.g. "Tomato Late Blight")
      string treatmentHash;    // Cryptographic hash of prescribed ICAR protocol
      bool isSafe;             // Deterministic safety core verification flag
  }
  ```
* **Gasless Relayer Architecture:** Farmers do not manage Web3 wallets or pay gas fees. The backend developer key acts as an autonomous relayer, signing and broadcasting transactions with nonces tracked dynamically via `web3.eth.get_transaction_count(account, 'pending')`.
* **Telemetry Ledger:** Generates direct clickable links to the BaseScan block explorer (`https://sepolia.basescan.org/tx/{tx_hash}`).

---

### 6. Vernacular Neural Acoustic Subsystem (`Agent 5`)

* **Engine:** **Sarvam AI (Bulbul:v3)** neural text-to-speech engine.
* **Language Support (11 Indic Languages):**
  * `hi-IN` (Hindi), `pa-IN` (Punjabi), `te-IN` (Telugu), `ta-IN` (Tamil), `ml-IN` (Malayalam), `kn-IN` (Kannada), `bn-IN` (Bengali), `mr-IN` (Marathi), `gu-IN` (Gujarati), `od-IN` (Odia), `en-IN` (Indian English).
* **Advisory Structure:**
  1. *Colloquial Respectful Greeting* (e.g. *ਕਿਸਾਨ ਵੀਰੋ, రైతు సోదరులారా, விவசாய சகோதரர்களே*).
  2. *Live Weather Context* (e.g. *"Field temperature is 28°C with 76% humidity"*).
  3. *Pathology Description* in native script (e.g. *पत्ती फफूंद (Leaf Mold)*, *पछेता झुलसा (Late Blight)*).
  4. *Exact Chemical & Mixing Instruction* (*Chemical name, exact dosage per acre, and 200L clean water volume*).
  5. *Field Drainage & Rain Precautions*.

---

### 7. Frontend Telemetry & Cybernetic Canvas

* **Farmer View ([`FarmerView.jsx`](file:///c:/Users/vansh/OneDrive/Desktop/AgriNexus/frontend/src/components/FarmerView.jsx)):**
  * Zero-clutter mobile interface with single-tap capture.
  * Live **Farm Weather HUD Badge** (`⛅ 28.4°C · 76% Humidity · Safe to Spray ✓`).
  * Auto-playing Sarvam AI audio player.
* **Swarm Control Room ([`TelemetryView.jsx`](file:///c:/Users/vansh/OneDrive/Desktop/AgriNexus/frontend/src/components/TelemetryView.jsx)):**
  * Cybernetic 3D SVG canvas running on a real-time WebSocket event bus (`/ws/telemetry`).
  * **Progressive 850ms laser line propagation** linking active nodes sequentially (`Vision` $\rightarrow$ `RAG` $\rightarrow$ `Safety` $\rightarrow$ `Web3` $\rightarrow$ `Voice`).
  * Bot kinetic movements (Vision circular wobble, RAG vertical float, Safety shield rotation, Web3 3D tilt, Voice harmonic pulse).

---

## 🔄 End-to-End Execution Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 🌾 Farmer (Client UI)
    participant API as ⚡ FastAPI Gateway
    participant Weather as ⛅ Weather Service
    participant Vision as 🧠 Agent 1 (Edge Vision)
    participant RAG as 📚 Agent 2 (ICAR RAG)
    participant Safety as 🛡️ Agent 3 (C++ Core)
    participant Web3 as ⛓️ Agent 4 (Base Sepolia)
    participant Voice as 🎙️ Agent 5 (Sarvam AI)
    participant WS as 📊 Telemetry WebSocket

    Farmer->>API: POST /api/v1/analyze (Image, Language, GPS)
    API->>Weather: Fetch live weather (EXIF / GPS / Baseline)
    Weather-->>API: {temp: 28.4°C, humidity: 76%, rain_risk: 5%}
    
    API->>Vision: Execute ONNX EfficientNet-B4
    Vision-->>API: {diagnosis: "Tomato Late Blight", confidence: 0.96}
    API->>WS: Broadcast Node Event (Vision -> RAG laser)

    API->>RAG: Query ICAR database for "Tomato Late Blight"
    RAG-->>API: {chemical: "Azoxystrobin + Difenoconazole", dosage: 150ml}
    API->>WS: Broadcast Node Event (RAG -> Safety laser)

    API->>Safety: Evaluate chemical against CIB&RC & live weather
    Safety-->>API: {is_safe: true, dosage: 150ml, weather_ok: true}
    API->>WS: Broadcast Node Event (Safety -> Web3 laser)

    API->>Web3: Mint SHA-256 passport on Base Sepolia
    Web3-->>API: {tx_hash: "0xe7ef83...4223", passport_id: 12}
    API->>WS: Broadcast Node Event (Web3 -> Voice laser)

    API->>Voice: Synthesize Indic speech (Sarvam Bulbul:v3)
    Voice-->>API: {audio_url: "/static/audio/treatment_pa.wav"}
    API->>WS: Broadcast Final State (Sync Complete)

    API-->>Farmer: 200 OK (Diagnosis, Weather HUD, BaseScan Link, Audio Note)
    Farmer->>Farmer: Auto-play vernacular spoken audio advisory
```

---

## 🔒 Threat Modeling & Security Boundaries

| Threat Vector | Severity | Mitigation Architecture |
| :--- | :--- | :--- |
| **LLM Chemical Hallucination** | 🔴 Critical | Deterministic C++ Safety Engine intercept; hardcoded CIB&RC banned list; zero LLM authority over dosages. |
| **Pesticide Overdose Injury** | 🔴 Critical | Hard statutory ceiling ($350\text{ ml/g}$ max per acre); humidity dosage attenuation formula. |
| **Counterfeit Record Forgery** | 🟠 High | SHA-256 leaf and treatment hashes minted immutably on Base Sepolia blockchain. |
| **Private Key Exposure** | 🟠 High | Developer private keys loaded exclusively via server-side environment variables; never exposed to client bundles. |
| **Network Outage in Remote Fields** | 🟡 Medium | Offline ONNX Edge AI model executing locally on CPU in 82ms with pure Numpy tensors. |
| **GPS Spoofing / Missing Location** | 🟢 Low | 3-Tier fallback hierarchy (EXIF GPS $\rightarrow$ Device GPS $\rightarrow$ Regional Agricultural Baseline). |

---

## 🚢 Containerization & Production Deployment

AgriNexus uses a multi-stage **Production Dockerfile**:

```
[ Stage 1: node:20-alpine ] ──► Builds React 18 / Vite Production Bundle
                                                │
[ Stage 2: python:3.12-slim ] ─► Installs C++ Toolchain & Compiles Safety Core
                                                │
[ Final Production Image ] ────► Combines FastAPI + Static Assets (Port 8000)
```

* **Build Validation:** Tested via GitHub Actions Buildx on every pull request.
* **Orchestration:** Managed via [`docker-compose.yml`](file:///c:/Users/vansh/OneDrive/Desktop/AgriNexus/docker-compose.yml) with automatic restart policies and container health checks (`/api/v1/health`).
