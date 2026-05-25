# NestAI

NestAI 鏄竴涓┖闂寸敓娲绘柟寮?Agent锛氱敤鎴蜂笂浼犵湡瀹炴埧闂淬€佹闈㈡垨瑙掕惤鐓х墖鍚庯紝绯荤粺浼氬厛鐞嗚В绌洪棿涓庣敓娲绘柟寮忥紝鍐嶇敓鎴愬姩鎬侀棶鍗枫€佷笁妗ｇ┖闂村共棰勬柟妗堛€佸浘鐢熷浘鏀归€犻瑙堛€佽鍔ㄦ敹钘忋€佸弽棣堜俊浠跺拰闀挎湡璁板繂銆?
褰撳墠椤圭洰鐨勭洰鏍囬儴缃叉灦鏋勬槸锛?
- 鍓嶇锛歏ercel
- 鍚庣锛歊ender
- 鏁版嵁搴撲笌鍥剧墖瀛樺偍锛歋upabase Postgres + Supabase Storage

## 褰撳墠杩涘睍

- 鍓嶇鏄?React + Vite锛屼綅浜?`frontend/`銆?- 鍚庣鏄?FastAPI锛屼綅浜?`backend/`銆?- 鏈湴寮€鍙戦粯璁ょ户缁娇鐢?SQLite 鍜屾湰鍦?`uploads/`銆?- 鐢熶骇鐜鍙互閫氳繃 `DATABASE_URL` 浣跨敤 Supabase Postgres銆?- 涓婁紶鍥剧墖鍜岀敓鎴愬浘鐗囧凡閫氳繃 `StorageService` 鏀寔 Supabase Storage銆?- 宸插姞鍏?`render.yaml` 鍜?`vercel.json`锛岀敤浜?Render/Vercel 閮ㄧ讲銆?
## 椤圭洰缁撴瀯

```text
NestAI/
  frontend/                         # React + Vite 鍓嶇
    public/nobi/               # Nobi 鍔ㄧ敾绱犳潗
    src/
      components/              # 閫氱敤 UI 缁勪欢
      pages/                   # Grow / Upload / Chat / Result / Next / Share / Letter / Me
      stores/                  # Zustand 鍓嶇鐘舵€?      lib/                     # API銆佹枃妗堛€佸伐鍏峰嚱鏁?
  backend/               # FastAPI 鍚庣
    app/
      api/                     # REST API 璺敱
      core/                    # 閰嶇疆涓?LLM Manager
      services/                # Vision / Workflow / Image Generation / Memory / Storage
      workflows/               # LangGraph 鑺傜偣涓庣姸鎬?
  prompts/                     # 鍙紪杈戠敓浜?Prompt P001-P005
  tests/                       # API 涓庡浘鐢熷浘娴嬭瘯鑴氭湰
  docs/                        # 鏋舵瀯涓庨儴缃叉枃妗?  render.yaml                  # Render 鍚庣閮ㄧ讲閰嶇疆
  vercel.json                  # Vercel 鍓嶇閮ㄧ讲閰嶇疆
```

## 鏈湴鍚姩

瀹夎渚濊禆锛?
```bash
pnpm install
python -m pip install -r backend/requirements.txt
```

鍒涘缓鍚庣鐜鍙橀噺鏂囦欢锛?
```bash
cp backend/.env.example backend/.env
```

鑷冲皯闇€瑕侀厤缃細

```env
OPENAI_API_KEY=your_key
DEFAULT_LLM_PROVIDER=OPENAI
VISION_LLM_PROVIDER=OPENAI
IMAGE_PROVIDER=OPENAI
IMAGE_MODEL=gpt-image-1.5
```

鍚姩鍓嶅悗绔細

```bash
pnpm dev
```

Windows PowerShell 涔熷彲浠ヨ繍琛岋細

```powershell
.\start.ps1
```

榛樿鍦板潃锛?
- 鍓嶇锛歚http://localhost:5000`
- 鍚庣锛歚http://localhost:8000`
- API 鏂囨。锛歚http://localhost:8000/docs`

涔熷彲浠ュ垎寮€鍚姩锛?
```bash
pnpm dev:frontend
pnpm dev:backend
```

## 浜戦儴缃?
瀹屾暣閮ㄧ讲姝ラ瑙侊細

```text
docs/Deployment_Vercel_Render_Supabase.md
```

绠€鐗堟祦绋嬶細

1. 鍒涘缓 Supabase 椤圭洰銆?2. 鍒涘缓 Supabase Storage bucket锛歚nestai-uploads`銆?3. 鐢?`render.yaml` 鍦?Render 閮ㄧ讲 FastAPI 鍚庣銆?4. 鐢?`vercel.json` 鍦?Vercel 閮ㄧ讲 Vite 鍓嶇銆?5. 鍦?Vercel 璁剧疆 `VITE_API_BASE_URL` 鎸囧悜 Render 鍚庣鍦板潃銆?
Render 鍚庣鍏抽敭鐜鍙橀噺锛?
```env
APP_ENV=production
DATABASE_URL=postgresql://...
STORAGE_BACKEND=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=nestai-uploads
PUBLIC_BASE_URL=https://your-render-service.onrender.com
CORS_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:5000
OPENAI_API_KEY=your_key
```

Vercel 鍓嶇鍏抽敭鐜鍙橀噺锛?
```env
VITE_API_BASE_URL=https://your-render-service.onrender.com
```

涓嶈鎶?`SUPABASE_SERVICE_ROLE_KEY` 鏀惧埌 Vercel 鎴栦换浣曞墠绔唬鐮侀噷銆?
## 鏍稿績娴佺▼

1. Upload锛氱敤鎴蜂笂浼犵湡瀹炵┖闂寸収鐗囥€?2. P001锛氳瑙?LLM 鐢熸垚 `Memory01`銆佺┖闂存瑙堛€佸姩鎬侀棶棰樺拰瀹夊叏鐨勪汉鏍?鐢熸椿鏂瑰紡绾跨储銆?3. Chat锛氱敤鎴峰洖绛斿姩鎬侀棶鍗枫€?4. P002锛氭枃鏈?LLM 鏍规嵁鍥剧墖鐞嗚В銆侀棶鍗风瓟妗堝拰闀挎湡璁板繂鐢熸垚涓夋。骞查鏂规銆?5. Result锛氱敤鎴烽€夋嫨鏂规妗ｄ綅锛屽苟鐐瑰嚮棰勮鍙樺寲銆?6. P004锛氭妸鎵€閫夎鍔ㄦ柟妗堣浆鎹㈡垚鍥剧敓鍥?prompt銆?7. Image API锛氱敤鍘熷浘鐢熸垚鏀归€犲悗鐨?after-image銆?8. Next / Share / Letter / Me锛氭敹钘忚鍔ㄣ€佽褰曞弽棣堛€佺敓鎴愬洖淇★紝骞舵洿鏂伴暱鏈熻蹇嗐€?
## 鏁版嵁涓庡瓨鍌?
鏈湴寮€鍙戯細

- SQLite锛歚backend/nestai.db`
- 涓婁紶/鐢熸垚鍥剧墖锛歚backend/uploads/`

鐢熶骇鐜锛?
- Supabase Postgres锛氶€氳繃 `DATABASE_URL`
- Supabase Storage锛氶€氳繃 `STORAGE_BACKEND=supabase`
- 鍚庣閫氳繃 `PUBLIC_BASE_URL` 杩斿洖鍙闂浘鐗?URL

鍚庣缁熶竴淇濈暀 `/uploads/...` 鐨?URL 褰㈡€侊紝鎵€浠ュ墠绔笉闇€瑕佸叧蹇冨浘鐗囧疄闄呮潵鑷湰鍦版枃浠剁郴缁熻繕鏄?Supabase Storage銆?
## 娴嬭瘯涓庢鏌?
瀹屾暣椤圭洰鏋勫缓锛?
```bash
pnpm build
```

鍓嶇鏋勫缓锛?
```bash
pnpm --dir frontend build
```

鍚庣璇硶妫€鏌ワ細

```bash
cd backend
python -m compileall app
```

鍥剧敓鍥鹃摼璺共璺戯細

```bash
python tests/api/test_generation.py --dry-run
```

鐪熷疄璋冪敤鍥剧敓鍥撅細

```bash
python tests/api/test_generation.py
```

## Prompt Engineering

鐢熶骇 Prompt 浣嶄簬鏍圭洰褰?`prompts/`锛?
- `P001_space_analysis.md`锛氬浘鐗囩悊瑙ｃ€丮emory01銆佸姩鎬侀棶鍗?- `P002_intervention_plan.md`锛氶棶鍗?+ memory 鍒颁笁妗ｅ共棰勬柟妗?- `P003_reflection_letter.md`锛氬弽棣堝埌 reflection letter
- `P004_image_prompt.md`锛氳鍔ㄦ柟妗?+ 鍘熷浘鍒板浘鐢熷浘 prompt
- `P005_bauhaus_image_edit.md`锛氱嫭绔嬪浘鐢熷浘娴嬭瘯 prompt

姣忔淇敼 Prompt 鍚庯紝寤鸿鑷冲皯杩愯锛?
```bash
python tests/api/test_generation.py --dry-run
pnpm --dir frontend build
```

