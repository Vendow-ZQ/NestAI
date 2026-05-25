# Deployment: Vercel + Render + Supabase

This project deploys as three pieces:

- Vercel: React/Vite frontend from `frontend/`
- Render: FastAPI backend from `backend/`
- Supabase: Postgres database and Storage bucket

## 1. Supabase

Create a Supabase project, then create a Storage bucket named:

```text
nestai-uploads
```

The bucket can be private. The FastAPI backend uses the service-role key to upload and read files, then serves them through `/uploads/...`.

Copy these values for Render:

```text
DATABASE_URL=<Supabase Postgres pooler URL with sslmode=require>
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key>
SUPABASE_STORAGE_BUCKET=nestai-uploads
```

Use the Supabase pooler connection string for Render. Keep `SUPABASE_SERVICE_ROLE_KEY` only on the backend.

## 2. Render Backend

Use the root `render.yaml` blueprint, or create a Web Service manually:

```text
Root directory: backend
Build command: pip install -r requirements.txt
Start command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Health check path: /health
```

Set these Render env vars:

```text
APP_ENV=production
DATABASE_URL=<Supabase Postgres pooler URL>
STORAGE_BACKEND=supabase
SUPABASE_URL=<Supabase project URL>
SUPABASE_SERVICE_ROLE_KEY=<Supabase service role key>
SUPABASE_STORAGE_BUCKET=nestai-uploads
PUBLIC_BASE_URL=https://<your-render-service>.onrender.com
CORS_ORIGINS=https://<your-vercel-app>.vercel.app,http://localhost:5000
OPENAI_API_KEY=<OpenAI key>
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODELS=gpt-4o,gpt-4o-mini
OPENAI_TYPE=openai
DEFAULT_LLM_PROVIDER=OPENAI
VISION_LLM_PROVIDER=OPENAI
VISION_LLM_MODEL=gpt-4o
IMAGE_PROVIDER=OPENAI
IMAGE_MODEL=gpt-image-1.5
IMAGE_OUTPUT_FORMAT=png
IMAGE_SIZE=auto
IMAGE_QUALITY=medium
```

After deploy, verify:

```text
https://<your-render-service>.onrender.com/health
```

## 3. Vercel Frontend

Import the GitHub repo into Vercel. The root `vercel.json` builds the frontend with:

```text
pnpm --dir frontend build
```

Set this Vercel env var:

```text
VITE_API_BASE_URL=https://<your-render-service>.onrender.com
```

Redeploy Vercel after the Render URL is final.

## Local Development

Local development still works without Supabase:

```text
pnpm dev
```

By default the backend uses local SQLite and local `uploads/`. To test a cloud-like frontend locally, create `frontend/.env`:

```text
VITE_API_BASE_URL=http://localhost:8000
```

