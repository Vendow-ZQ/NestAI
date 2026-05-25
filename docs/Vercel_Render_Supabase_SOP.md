# Vercel + Render + Supabase SOP

This SOP is the production deployment runbook for NestAI.

## 0. Target Architecture

```text
User browser
  -> Vercel static frontend
  -> Render FastAPI backend
  -> Supabase Postgres
  -> Supabase Storage
  -> OpenAI APIs
```

Use this split because the frontend is a Vite static app, the backend is a long-running FastAPI service, and user/session/image data must live outside the developer laptop.

## 1. Preflight

Confirm the repo is pushed to GitHub:

```bash
git status --short --branch
git push origin main
```

Confirm the app builds locally:

```bash
pnpm build
```

Confirm the backend health endpoint works locally:

```bash
pnpm dev
curl http://localhost:8000/health
```

Required accounts:

- GitHub
- Supabase
- Render
- Vercel
- OpenAI

## 2. Supabase Setup

Create a Supabase project.

Create a Storage bucket:

```text
nestai-uploads
```

Recommended bucket visibility:

```text
Private
```

The backend uses the service role key to upload and read files, then serves them through `/uploads/...`.

Collect these values:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
```

For `DATABASE_URL`, use a Supabase Postgres connection string appropriate for a persistent backend service. Prefer the pooler/session connection string when available, and include SSL:

```text
postgresql://.../postgres?sslmode=require
```

Security rule:

```text
Never put SUPABASE_SERVICE_ROLE_KEY in Vercel or frontend code.
```

## 3. Render Backend Setup

Create a Render Web Service or Blueprint from the GitHub repo.

Preferred path:

```text
Render -> New -> Blueprint -> select Vendow-ZQ/NestAI
```

Render should read `render.yaml` from the repository root.

Expected backend config:

```text
Root directory: python-server
Build command: pip install -r requirements.txt
Start command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Health check path: /health
```

Set Render environment variables:

```env
APP_ENV=production
APP_HOST=0.0.0.0
DATABASE_URL=postgresql://...
STORAGE_BACKEND=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=nestai-uploads
PUBLIC_BASE_URL=https://your-render-service.onrender.com
CORS_ORIGINS=*
OPENAI_API_KEY=your_openai_key
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

Deploy Render.

Verify:

```text
https://your-render-service.onrender.com/health
```

Expected response:

```json
{"status":"healthy","timestamp":"..."}
```

If the first deploy fails, check:

- `DATABASE_URL` is a Postgres URL and includes SSL.
- `SUPABASE_SERVICE_ROLE_KEY` is present only on Render.
- `OPENAI_API_KEY` is present.
- Render service uses Python and the `python-server` root directory.

## 4. Vercel Frontend Setup

Create a Vercel project from GitHub:

```text
Vercel -> Add New Project -> Import Vendow-ZQ/NestAI
```

The repository root contains `vercel.json`, which builds the frontend from `web/`.

Expected build behavior:

```text
Install command: pnpm install
Build command: pnpm --dir web build
Output directory: web/dist
```

Set Vercel environment variable:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com
```

Deploy Vercel.

Verify the app opens at the Vercel URL.

## 5. Lock Down CORS

After Vercel gives a final URL, update Render:

```env
CORS_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:5000
```

Redeploy Render.

Do not leave `CORS_ORIGINS=*` for production unless debugging.

## 6. End-to-End Smoke Test

Open the Vercel URL and test:

1. `/grow` loads.
2. Upload one space image.
3. Session is created.
4. Chat questions appear.
5. Generate intervention plan.
6. Generate preview image.
7. Open `/next` and confirm the next action appears.

Check Supabase:

- Postgres has created NestAI tables automatically.
- `nestai-uploads` contains uploaded or generated image objects.

Check Render:

- Logs show `Database initialized`.
- Logs show `Storage backend: supabase`.
- `/health` stays healthy.

## 7. Updating Production

Normal deploy flow:

```bash
git status --short
pnpm build
git add -A
git commit -m "Your change"
git push origin main
```

Render and Vercel should auto-deploy from `main`.

If only environment variables changed:

- Redeploy Render after backend env changes.
- Redeploy Vercel after `VITE_` frontend env changes, because Vite injects these at build time.

## 8. Rollback

Fast rollback:

1. In GitHub, identify the previous good commit.
2. In Vercel, redeploy the previous deployment if the issue is frontend-only.
3. In Render, redeploy the previous successful deploy if the issue is backend-only.
4. If database writes caused bad data, fix data directly in Supabase after exporting a backup.

## 9. Secrets Checklist

Safe in Vercel:

```text
VITE_API_BASE_URL
```

Safe in Render only:

```text
DATABASE_URL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
```

Never commit:

```text
python-server/.env
web/.env
*.db
uploads/
```

## 10. References

- Vercel Vite deployment docs: https://vercel.com/docs/frameworks/frontend/vite
- Render Blueprint YAML docs: https://render.com/docs/blueprint-spec
- Render FastAPI docs: https://render.com/docs/deploy-fastapi
- Supabase Postgres connection strings: https://supabase.com/docs/reference/postgres/connection-strings
