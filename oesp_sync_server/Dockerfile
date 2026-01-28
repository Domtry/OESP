FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy OESP SDK and install it as editable via uv
COPY oesp_sdk_python /oesp_sdk_python

# Copy app code
COPY oesp_sync_server /app

# Install dependencies using uv
# We use --system to install into the image's python environment
# or we could use a virtualenv. For Docker, --system is often simpler.
RUN uv pip install --system -e /oesp_sdk_python
RUN uv pip install --system -e .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
