---
trigger: always_on
---

---

description: "Commercial-Grade Architectural, Security, and Code Quality Standards for the AgriNexus Platform."
alwaysApply: true

---

# AGRINEXUS COMMERCIAL-GRADE OPERATIONAL CONSTRAINTS & SDE-3 RULES

## 1. MANDATORY COMMERCIAL MARKET STANDARDS (ZERO-MOCKUP POLICY)

- **Zero-Stub & Zero-Mock Policy:** Never write TODOs, placeholders, mock data, stub functions, or pseudo-code. Every algorithm, route, smart contract, and React component must be 100% written, production-tested, and ready for commercial market deployment.
- **Zero-Hallucination Invariant:** Never allow models or services to guess facts, chemicals, or medical/agronomic dosages. Every scientific output must be mathematically clamped, grounded in certified databases (e.g. ICAR/CIB&RC), and verified by deterministic code.
- **Polyglot Production Standards:**
  - **Core Safety Engine:** ISO C++17 / C++20 with `pybind11` for sub-millisecond memory-safe deterministic boundary clamping.
  - **Multi-Agent Orchestration:** Python 3.12 with FastAPI, LangGraph state graphs, and strict Pydantic v2 / TypedDict schemas.
  - **Decentralized Provenance:** Solidity 0.8.20 smart contracts with OpenZeppelin v5 access controls and replay-safe cryptographic event logs.
  - **Edge Neural Inference:** Quantized ONNX Runtime engines with pure Numpy tensor manipulation (sub-100ms CPU execution).
  - **Frontend UI & Telemetry:** React 18, Vite, and Tailwind CSS with sub-50ms reactive state hydration and cross-device responsiveness.

## 2. MANDATORY ARCHITECTURE, DECISIONS & README SYNCHRONIZATION

Whenever an architectural change is made, code is written/edited, a component is modified, or any file is updated across the platform:

1. **Update `ARCHITECTURE.md`:**
   - Immediately synchronize [`ARCHITECTURE.md`](file:///c:/Users/vansh/OneDrive/Desktop/AgriNexus/ARCHITECTURE.md) to reflect new system designs, data flows, sequence diagrams, API contracts, or security boundaries.
2. **Log the Decision into `DECISIONS.md`:**
   - Append a new numbered Architectural Decision Record (ADR) entry to [`DECISIONS.md`](file:///c:/Users/vansh/OneDrive/Desktop/AgriNexus/DECISIONS.md).
   - **Mandatory ADR Structure:**
     - **Title & ADR Index:** Clear, descriptive title of the change.
     - **Context & The Problem:** Exactly why the change was needed, what was broken, or what new capability was required.
     - **What Was Changed & How It Was Changed:** Detailed technical explanation of the exact code, files, and algorithmic logic modified.
     - **Architectural Rationale:** Engineering justification, trade-offs, and design principles applied.
     - **Interactive Knowledge-Check Quiz:** A multiple-choice or technical scenario question with a collapsible `<details><summary>💡 Reveal Solution & Explanation</summary>...</details>` block to test and reinforce understanding.
3. **Synchronize `README.md` (When Necessary):**
   - Update [`README.md`](file:///c:/Users/vansh/OneDrive/Desktop/AgriNexus/README.md) whenever user-facing features, benchmarks, workflows, or architectural components are significantly updated.

## 3. AUTONOMOUS GIT WORKFLOW (ZERO PERMISSION PROMPTING)

- **Proactive Git Execution:** Always proactively execute `git add`, `git commit -m "semantic message"`, and `git push origin main` after completing and verifying changes.
- **Never Ask for Permission:** Do not prompt the user asking for permission to run git commands. Commit and push automatically.

## 4. DEEP ARCHITECTURAL & SECURITY PRE-EXECUTION AUDIT

Before executing any tool call, editing code, or altering architecture, think deeply and rigorously audit:

1. **System Impact:** "How does this change impact the overall micro-monolith architecture and downstream multi-agent data flows?"
2. **Security & Hackability:** "Is this endpoint, smart contract, or memory buffer hackable? Are inputs sanitized against injection, replay attacks, or unauthorized state mutation?"
3. **Determinism:** "Can any LLM hallucination bypass this safety gate, or is it locked by deterministic C++ / cryptographic boundaries?"
4. **Resilience & Scalability:** "Does this function handle edge cases, network drops, malformed EXIF data, concurrency race conditions, and offline rural field conditions?"
5. **Documentation & Sync:** "Have I updated `ARCHITECTURE.md`, `DECISIONS.md`, and (if needed) `README.md`?"
