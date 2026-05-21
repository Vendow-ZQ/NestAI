# NestAI Agent Handoff Status

Last updated: 2026-05-19

This document is for agents that only know the product definition. It summarizes the current implementation state, architecture, working flows, known gaps, and next actions.

## 1. Current Goal

NestAI is a mobile-first web app that turns a user's uploaded space photo into:

1. P001 image understanding and a dynamic questionnaire.
2. P002 intervention plans based on the questionnaire, Memory01, and constraints.
3. Optional OpenAI image generation for redesigned space visuals.
4. P003 reflection letter after the user shares changes.
5. Grow/Next/Me app shell for continuing actions and shared feed.

The current priority is to fully connect dynamic input to dynamic output with minimal/free infrastructure. Avoid adding many cloud services.

## 2. Tech Stack

Frontend:

- Vite + React + TypeScript
- Tailwind CSS
- Zustand
- React Router
- lucide-react

Backend:

- FastAPI
- SQLite local database
- Local uploaded files under `python-server/uploads`
- LangChain + LangGraph for AI workflow orchestration
- OpenAI as preferred provider for vision, text, and image generation
- Gemini/Kimi config remains as backup where configured

Run commands from repo root:

```bash
pnpm dev
pnpm build
pnpm dev:web
pnpm dev:server
```

Important env file:

```text
python-server/.env
```

Do not print API keys. The intended current provider setup is OpenAI-first:

```env
DEFAULT_LLM_PROVIDER=OPENAI
DEFAULT_LLM_MODEL=gpt-4o
VISION_LLM_PROVIDER=OPENAI
VISION_LLM_MODEL=gpt-4o
IMAGE_PROVIDER=OPENAI
IMAGE_MODEL=gpt-image-1.5
```

## 3. High-Level Architecture

Frontend routes:

- `/grow`: public/shared Grow feed plus upload entry and "My Next" preview.
- `/upload`: image upload.
- `/generating?type=space`: calls P001 analyze.
- `/chat`: dynamic questionnaire generated from image understanding.
- `/generating?type=intervention`: calls P002 intervention generation.
- `/result`: intervention plan and optional image generation.
- `/share`: user uploads after images and feelings.
- `/generating?type=letter`: calls P003 letter generation.
- `/letter`: reflection letter.
- `/next`: current user's next actions.
- `/me`: profile/history shell.

Backend modules:

- `app/api/upload.py`: upload endpoint.
- `app/api/spaces.py`: persisted spaces.
- `app/api/sessions.py`: session lifecycle, P001/P002/P003 endpoints, feed/next list.
- `app/services/vision_service.py`: P001 image understanding and dynamic questionnaire.
- `app/services/workflow_service.py`: thin coordinator around LangGraph flows.
- `app/services/image_generation_service.py`: OpenAI image generation, saves generated images locally.
- `app/services/memory_service.py`: SQLite models and persistence.
- `app/workflows/*`: LangGraph state, nodes, and stage graphs.
- `app/prompts/__init__.py`: prompt builders for P002/P003 and workflow nodes.

## 4. Implemented Product Flows

### Upload And P001

Status: mostly working.

Current flow:

1. Frontend uploads image.
2. Backend stores file under `python-server/uploads/YYYYMMDD/...`.
3. Session is created with image URLs.
4. `/api/sessions/{session_id}/analyze` calls `VisionService`.
5. `prompts/P001_space_analysis.md` asks OpenAI vision to output:
   - `Memory01`
   - human-readable QA
   - strict JSON questionnaire
6. Backend validates questionnaire must be exactly usable by frontend.
7. Chat page displays only a one-sentence summary, not the full Memory01.

Recent fix:

- P001 prompt was rewritten to avoid unsafe over-claiming about personality/psychology.
- `vision_service.py` now parses JSON first, then QA markdown, then repairs from Memory01, then falls back only if needed.
- Existing cached bad/default questionnaires no longer block re-analysis unless they pass the strict frontend questionnaire check.
- Force re-run is supported:

```http
POST /api/sessions/{sessionId}/analyze?force=true
```

### Dynamic Questionnaire

Status: working.

Frontend file:

```text
web/src/pages/chat/ChatPage.tsx
```

The page validates that questions have 3 items and 4 options each. It no longer shows garbled fallback text. It stores:

- step 1 answers as `aspiration`
- step 2 answers as `currentState`
- step 3 answers as constraints

Known limitation:

- Constraint typing is still loose. Current frontend stores all selected step-3 answers into `sharing`, `budget`, and `wallModification` joined as text. This is acceptable for now but should become a structured schema later.

### P002 Intervention

Status: connected through LangGraph.

Endpoint:

```http
POST /api/sessions/{sessionId}/intervention
```

Implementation:

- `workflow_service.run_intervention_generation`
- `app/workflows/nestai_graph.py`
- `app/workflows/nodes.py`
- `app/workflows/utils.py`

Input:

- Memory01 / space analysis
- dynamic questionnaire answers
- constraints

Output:

- intervention plan by level
- persisted in SQLite
- consumed by Result page

### OpenAI Image Generation

Status: backend and frontend button are connected; real generation is manual/user-triggered.

Endpoint:

```http
POST /api/sessions/{sessionId}/generate-images
```

Frontend:

```text
web/src/pages/result/ResultPage.tsx
```

Backend:

```text
python-server/app/services/image_generation_service.py
```

Generated images are saved under:

```text
python-server/uploads/generated/YYYYMMDD/
```

Returned URLs look like:

```text
/uploads/generated/YYYYMMDD/file.png
```

Important:

- Current intended model is `gpt-image-1.5`.
- Do not auto-trigger generation on every result view; it can spend quota.

### Share Changes And P003 Letter

Status: connected, but still needs more real UX testing.

Flow:

1. `/share` lets user upload after images and enter feelings.
2. `GeneratingPage` with `type=letter` calls P003.
3. Backend generates reflection letter through LangGraph.
4. `/letter` displays the saved result.

Files:

- `web/src/pages/share/SharePage.tsx`
- `web/src/stores/share-store.ts`
- `web/src/pages/letter/LetterPage.tsx`
- `python-server/app/services/workflow_service.py`

Known risk:

- The share upload path was previously not fully reliable. Re-test with a fresh session after any major route/UI changes.

## 5. Grow Feed And Next

Recent change:

- Navigation bar is now always visible across the app, not only on `/grow`, `/next`, `/me`.
- `GrowPage` now behaves more like a public shared feed.
- `Next` remains current-user oriented.

Frontend:

- `web/src/App.tsx`
- `web/src/components/CustomTabBar.tsx`
- `web/src/pages/index/GrowPage.tsx`
- `web/src/pages/next/NextPage.tsx`

Backend:

- `MemoryService.list_public_session_memories`
- `sessions.py` builds:
  - `sessions`: current user sessions
  - `nextActions`: current user next actions
  - `feed`: public/all-user session feed

Local seed image folder for Feed:

```text
D:\Code\NestAI\python-server\uploads\feed-seed
```

Supported formats:

```text
.jpg .jpeg .png .webp
```

URL pattern:

```text
/uploads/feed-seed/your-image.jpg
```

Use this folder when the Grow Feed needs visual variety before real multi-user content exists.

## 6. Data And Storage

Current local storage:

- SQLite DB: `python-server/nestai.db`
- Uploads: `python-server/uploads`
- Feed seed images: `python-server/uploads/feed-seed`
- Generated images: `python-server/uploads/generated`

This is enough for local prototype and multi-user simulation.

For real deployment, minimal recommended upgrade:

- Postgres for users/sessions/feed/workflow runs.
- Object storage for uploads/generated images.

Do not introduce many cloud services yet. If cloud is needed, prefer one simple platform such as Supabase:

- Supabase Postgres
- Supabase Storage
- optional auth later

## 7. Is This A Multi-Agent System?

Current implementation is a staged AI workflow, not a fully autonomous multi-agent system.

It has agent-like roles:

- P001 Space Observer: image understanding + Memory01 + questionnaire.
- P002 Intervention Planner: turns Memory01 and questionnaire answers into plans.
- Image Prompt/Generation Node: turns plan into image edit prompt and generated visuals.
- P003 Letter Writer: reflects on the user's shared change.

LangGraph is used as orchestration for the main AI stages. It is intentionally not overbuilt. Each stage can be treated as a graph/node boundary, with persistence through `workflow_runs`.

Current LangGraph files:

```text
python-server/app/workflows/state.py
python-server/app/workflows/nodes.py
python-server/app/workflows/nestai_graph.py
python-server/app/workflows/utils.py
```

## 8. Important Current Files

Prompts:

- `prompts/P001_space_analysis.md`: P001 vision + questionnaire prompt.
- `python-server/app/prompts/__init__.py`: P002/P003 prompt builders.

Frontend:

- `web/src/App.tsx`: global app shell and tab bar.
- `web/src/pages/upload/UploadPage.tsx`
- `web/src/pages/chat/ChatPage.tsx`
- `web/src/pages/generating/GeneratingPage.tsx`
- `web/src/pages/result/ResultPage.tsx`
- `web/src/pages/share/SharePage.tsx`
- `web/src/pages/index/GrowPage.tsx`
- `web/src/lib/api.ts`

Backend:

- `python-server/app/api/sessions.py`
- `python-server/app/api/upload.py`
- `python-server/app/api/spaces.py`
- `python-server/app/services/vision_service.py`
- `python-server/app/services/workflow_service.py`
- `python-server/app/services/image_generation_service.py`
- `python-server/app/services/memory_service.py`

Docs:

- `docs/NestAI_Product_Definition_v0.5.md`
- `docs/NestAI_Architecture_SOP.md`
- this file

## 9. Verification Already Run

Frequently run:

```bash
pnpm build
```

This runs:

```bash
pnpm --dir web build
cd python-server && python -m compileall app
```

Recent targeted checks:

```bash
python -m py_compile python-server\app\services\vision_service.py python-server\app\api\sessions.py
python -m py_compile python-server\app\api\sessions.py python-server\app\services\memory_service.py
```

P001 was smoke-tested once with a real local uploaded image and returned dynamic questions rather than fallback defaults.

## 10. Known Gaps / Next Work

Highest priority:

1. Re-test the whole fresh-user flow in browser:
   - upload image
   - generating space
   - chat questionnaire
   - generating intervention
   - result
   - generate image manually
   - share changes
   - letter
2. Tighten questionnaire answer schema:
   - separate aspiration/current blocker/constraints
   - constraints should not be stored as duplicated joined text
3. Clean remaining mojibake/garbled Chinese strings in older files:
   - some backend fallback strings
   - some older UI pages
4. Make Feed publication explicit:
   - currently Feed includes all sessions as public-like data
   - future: add `is_public`, `published_at`, `author_display_name`
5. Improve Share page reliability:
   - test image upload
   - verify uploaded images persist into feedback
   - verify letter uses feedback and images
6. Add minimal API tests without relying on FastAPI TestClient version mismatch.
7. Add clear dev data reset/seed command.

Architecture caution:

- Do not add a complex cloud stack now.
- Do not split into more agents unless it improves traceability.
- Keep LangGraph focused on AI stage orchestration, not every UI/API transition.

## 11. Suggested Next Agent Task

If another agent picks this up, the best next task is:

1. Start the app with `pnpm dev`.
2. Put 4-8 sample images into `python-server/uploads/feed-seed`.
3. Run a full browser flow from upload to letter.
4. Fix whatever breaks in the real flow.
5. Then clean remaining garbled UI copy page by page.

