# ==============================================================================
# AGRINEXUS - ENTERPRISE MULTI-STAGE PRODUCTION DOCKERFILE
# Polyglot Architecture: React (Vite) + Python 3.12 + C++ Safety Core + ONNX
# ==============================================================================

# ------------------------------------------------------------------------------
# STAGE 1: Build React 18 / Vite Production Bundle
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# STAGE 2: Python Runtime, C++ Safety Engine & Final Production Image
# ------------------------------------------------------------------------------
FROM python:3.12-slim AS final-runtime

# Set environment variables for production execution
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Install system dependencies & C++ compilation toolchain for deterministic safety engine
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r backend/requirements.txt

# Copy Backend Application Code
COPY backend/ ./backend/

# Copy Compiled React Frontend bundle from Stage 1 into static serving directory
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose backend port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Workdir into backend and run production ASGI server
WORKDIR /app/backend
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
