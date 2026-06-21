FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies (both backend and ML engine requirements)
COPY backend/requirements.txt ./requirements.txt
COPY ml-engine/requirements.txt ./ml-requirements.txt
RUN pip install --no-cache-dir -r requirements.txt -r ml-requirements.txt

# Copy ML engine (needed for model inference)
COPY ml-engine /ml-engine

# Copy backend code
COPY backend/ /app


# Expose port
EXPOSE 8000

# Start server (automatically generates data and trains model if missing)
CMD ["sh", "-c", "python3 /ml-engine/data/synthetic_generator.py && python3 /ml-engine/training/train_model.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]

