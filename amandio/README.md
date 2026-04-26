# Aerobastion — run with Docker

This project contains a Next.js frontend and a FastAPI backend for fire detection. The backend uses OpenCV and (optionally) Ultralytics YOLO for detection.

This README shows how to run the backend in Docker to isolate heavy ML dependencies.

Quick start (backend only)

```bash
# Build and start services
docker compose up --build

# The backend will be available at http://localhost:8000
# Health endpoint: http://localhost:8000/health
```

Notes about Ultralytics / Torch

- The Docker image installs `ultralytics` as listed in `backend/requirements.txt` by default. This will pull PyTorch as a dependency. The slim Python image and pip wheels should install CPU-only PyTorch automatically unless you provide CUDA-enabled wheels.
- If you want GPU support, you must:
  - Use a CUDA-enabled base image (e.g. nvidia/cuda) and install the correct PyTorch wheel for that CUDA version, or use the NVIDIA Container Toolkit with an appropriate base image.
  - Update the Dockerfile to install CUDA drivers/libs and the matching torch wheel. This is advanced; ask me and I can prepare a GPU-ready Dockerfile.

Frontend

- The repo expects a Node-based frontend in the root. You can run it locally with `npm install` + `npm run dev`.
- Optionally you can dockerize the frontend; a placeholder service is in `docker-compose.yml` commented out.

Volumes

- The `docker-compose.yml` mounts `./backend/videos` into the container as `/app/videos`. Place your test videos in that folder so the backend can access them.

Troubleshooting

- If the container fails during pip install due to missing build tools, the Dockerfile already installs `build-essential`.
- For large wheel downloads and long installs, run `docker compose build --no-cache` to force a fresh build.

Full-stack with frontend

This repository includes a `frontend/Dockerfile` and a `docker-compose.yml` service for the frontend. To build and run both frontend and backend:

```bash
docker compose build
docker compose up -d

# backend health
curl http://localhost:8000/health

# frontend (Next.js) should be on http://localhost:3000
```

Notes:
- The frontend Dockerfile uses a simple npm install/build pipeline. If you use `pnpm` locally and want to use it in the image, adapt the Dockerfile accordingly.
- The frontend expects to call the backend at `http://backend:8000` inside the Docker network; for the browser use `http://localhost:8000`.

