FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
      libpango-1.0-0 \
      libpangoft2-1.0-0 \
      libharfbuzz0b \
      libcairo2 \
      libgdk-pixbuf-2.0-0 \
      libffi8 \
      libglib2.0-0 \
      shared-mime-info \
      fonts-liberation \
      ca-certificates \
      curl \
    && rm -rf /var/lib/apt/lists/* \
    && ldconfig

WORKDIR /app

COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY . /app/

EXPOSE 8000

CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
