# Multi-stage build for production
FROM node:18-alpine AS frontend-build

# Build frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build

# Python backend
FROM python:3.11-slim

# Allow port to be configurable at build time
ARG PORT=5000
ENV PORT=$PORT
ENV BACKEND_PORT=$PORT
ENV BACKEND_HOST=0.0.0.0

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code (exclude frontend and unnecessary files)
COPY app/ ./app/
COPY run.py .
COPY start.sh .
COPY .env.example .

# Copy built frontend
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Create necessary directories and make start script executable
RUN mkdir -p logs uploads app/music_samples && \
    chmod +x start.sh

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Expose the configurable port
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/api/v1/health || exit 1

# Start the application
CMD ["./start.sh"]
