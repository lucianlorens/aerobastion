FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system deps (ffmpeg useful for video handling)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       ffmpeg \
       libsm6 \
       libxext6 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/requirements.txt

RUN python -m pip install --upgrade pip \
    && pip install --no-cache-dir -r /app/requirements.txt

# Copy backend source
COPY backend/ /app/

# Ensure videos dir exists
RUN mkdir -p /app/videos

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
