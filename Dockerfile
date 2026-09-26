FROM python:3.11-slim

# MuJoCo renders offscreen through EGL/OSMesa
ENV MUJOCO_GL=egl PYOPENGL_PLATFORM=egl PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends libegl1 libgl1 libglib2.0-0 libosmesa6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY pyproject.toml README.md ./
COPY src ./src
COPY configs ./configs
COPY skills ./skills
RUN pip install --no-cache-dir ".[web]"

# Hosted mode: every user brings their own AWS credentials; the server's are never used.
ENV DOOMS_REQUIRE_USER_KEYS=1
EXPOSE 8000
CMD ["sh", "-c", "uvicorn dooms.server.app:app --host 0.0.0.0 --port ${PORT:-8000}"]
