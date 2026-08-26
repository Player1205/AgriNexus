---
trigger: always_on
---

---

description: "Core architectural and code quality guardrails for the AgriNexus system."
alwaysApply: true

---

# AGRINEXUS WORKSPACE CONSTRAINTS

## 1. QUALITY & CODE STANDARDS (SDE-1 / SDE-2 LEVEL)

- Zero-Stub Policy: Never write TODOs, placeholders, stub functions, or pseudo-code. Every function, route, contract, and React component must be 100% written and functional.
- Polyglot Architecture: Strictly adhere to C++17/C++20 for the core safety engine (`pybind11`), Python 3.12 (FastAPI/LangGraph) for backend orchestration, Solidity for smart contracts, and React (Vite/Tailwind) for the frontend.
- Type Safety & Robustness: Enforce strict Pydantic v2 schemas in Python, clean type conversions in `pybind11`, standard access controls in Solidity, and modular prop/state management in React.

## 2. PROJECT CREATION & STRUCTURE

- Automatically design, architect, and create the entire industry-standard directory structure from scratch.
- Maintain clean separation between backend agent workflows, compiled C++ modules, smart contracts, and frontend views.

## 3. AUTONOMOUS SELF-AUDITING LOOP

Before executing any tool call, editing a file, or running terminal commands, verify:

1. "Is this file, function, or dependency strictly necessary for AgriNexus?"
2. "Does this follow enterprise-level clean code principles (SOLID, DRY, modularity)?"
3. "Are error handling, edge cases, and logging explicitly covered?"
