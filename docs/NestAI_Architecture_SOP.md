# NestAI Architecture SOP

## 1. 褰撳墠瀹氫綅

NestAI 褰撳墠鏄竴涓闃舵 AI 宸ヤ綔娴佷骇鍝侊紝涓嶆槸鎴愮啛鎰忎箟涓婄殑澶?Agent 绯荤粺銆?
鐜板湪宸茬粡鍏峰锛?
- 鍥剧墖涓婁紶
- 绌洪棿瑙嗚鍒嗘瀽
- Memory01 / 浜烘牸娲炲療 / 鍔ㄦ€侀棶鍗风敓鎴?- 闂嵎鍥炵瓟鏀堕泦
- 绌洪棿骞查鏂规鐢熸垚
- 鍒嗕韩椤靛浘鐗囦笌鎰熷彈杈撳叆
- 鍛婂埆淇＄敓鎴?
浠嶆湭瀹屽叏鎵撻€氾細

- 鐪熷疄鍥剧敓鍥炬敼閫犲浘
- Grow / Feed / Next / Me 鐨勭湡瀹炴暟鎹簮
- 绌洪棿鏁版嵁鎸佷箙鍖?- 闀挎湡璁板繂鐨勭郴缁熷寲鏇存柊
- LangGraph 鐘舵€佹満鐨勫畬鏁存帴绠?
鐩爣涓嶆槸鍋氫竴缁勮嚜鐢卞璇濈殑 Agent锛岃€屾槸鍋氫竴涓骇鍝佺骇 AI Workflow锛?
```text
Frontend
  -> FastAPI
  -> LangGraph Workflow
  -> Agent Nodes
  -> Tools
  -> Memory / DB / Storage
```

## 2. 鎺ㄨ崘鎶€鏈灦鏋?
### Frontend

- React
- Vite
- TypeScript
- Tailwind
- Zustand

### Backend

- FastAPI
- LangGraph
- LangChain-compatible LLM wrapper
- SQLite
- Local file storage
- Simple background jobs

### MVP 鍘熷垯

- 灏介噺鏈湴浼樺厛
- 灏介噺灏戞湇鍔?- 灏介噺灏戣处鍙?- 灏介噺灏戦儴缃插鏉傚害
- 鍏堟妸鐪熷疄浜у搧閾捐矾璺戦€氾紝鍐嶈€冭檻杩佺Щ浜戞湇鍔?
### MVP 鏈€灏忔妧鏈爤

- Frontend: React + Vite + TypeScript + Tailwind
- Backend: FastAPI
- Database: SQLite
- File Storage: 鏈湴 `uploads/`
- Workflow: LangGraph, 鍙敤浜庝富 AI 閾捐矾
- Background Jobs: FastAPI `BackgroundTasks`
- LLM / Vision / Image Generation: 涓€涓粺涓€ Provider 閰嶇疆

濡傛灉鍚庣画闇€瑕佷笂绾跨粰鏇村鐢ㄦ埛浣跨敤锛屽啀鑰冭檻杩佺Щ鍒?Supabase 鎴栧叾浠栦簯鏈嶅姟銆?
## 3. 鏁版嵁瀛樺偍鍒嗗眰

### SQLite

鐢ㄤ簬缁撴瀯鍖栦笟鍔℃暟鎹細

- `users`
- `spaces`
- `space_images`
- `sessions`
- `space_analyses`
- `question_answers`
- `intervention_plans`
- `generated_images`
- `feedbacks`
- `letters`
- `next_actions`
- `feed_posts`
- `long_term_memories`
- `workflow_runs`

MVP 闃舵鐩存帴浣跨敤 SQLite 鍗冲彲銆傚畠瓒冲鏀拺鏃╂湡 demo銆佸皬瑙勬ā娴嬭瘯鍜屾湰鍦板紑鍙戙€?
鏈潵濡傛灉鍑虹幇杩欎簺鎯呭喌锛屽啀杩佺Щ Postgres锛?
- 澶氱敤鎴峰苟鍙戞槑鏄惧鍔?- 闇€瑕佺嚎涓婃寔涔呴儴缃?- 闇€瑕佸鏉傛煡璇㈠拰鏉冮檺闅旂
- 闇€瑕?pgvector 鍋氶暱鏈熻蹇嗘绱?
### Local File Storage

鐢ㄤ簬瀛樻斁澶ф枃浠讹細

- 鐢ㄦ埛涓婁紶鐨勫師濮嬬┖闂村浘
- AI 鐢熸垚鐨勭┖闂存敼閫犲浘
- 鐢ㄦ埛鍒嗕韩鐨?after 鍥?- Feed 鍗＄墖灏侀潰鍥?
MVP 闃舵鐩存帴瀛樺埌鏈湴锛?
```text
backend/
  uploads/
    originals/
    generated/
    feedback/
```

鏁版嵁搴撳彧淇濆瓨鍥剧墖璺緞鍜屽厓鏁版嵁锛?
```json
{
  "session_id": "...",
  "image_url": "...",
  "local_path": "...",
  "kind": "original | generated | after",
  "created_at": "..."
}
```

鏈潵闇€瑕佸叕缃戣闂€佸浜轰娇鐢ㄦ垨閮ㄧ讲鍒版棤鐘舵€佹湇鍔″櫒鏃讹紝鍐嶈縼绉诲埌 Supabase Storage / Cloudflare R2銆?
### Memory

鐭湡璁板繂锛?
- 缁戝畾 `session_id`
- 淇濆瓨鏈疆绌洪棿鍒嗘瀽銆侀棶鍗枫€佹柟妗堛€佸弽棣堛€佷俊浠?
闀挎湡璁板繂锛?
- 缁戝畾 `user_id`
- 淇濆瓨瀹＄編鍋忓ソ銆侀绠楀亸濂姐€佽鍔ㄤ範鎯€佺┖闂村巻鍙?
## 4. Agent 鍒掑垎

NestAI 搴旇閲囩敤鈥滃涓笓涓?Agent 鑺傜偣 + 涓€涓伐浣滄祦鍥锯€濈殑缁撴瀯銆?
### SpaceReaderAgent

杈撳叆锛?
- 鐢ㄦ埛涓婁紶鍥剧墖

杈撳嚭锛?
- Memory01
- 绌洪棿浜烘牸娲炲療
- 鐢ㄦ埛鍙鐨勪竴鍙ヨ瘽绌洪棿姒傝堪
- 鍔ㄦ€侀棶鍗?
### QuestionnaireAgent

杈撳叆锛?
- Memory01
- 鐢ㄦ埛鍥炵瓟

杈撳嚭锛?
- 缁撴瀯鍖栭棶鍗风粨鏋?- 鐢ㄦ埛鐩爣
- 褰撳墠闃荤
- 棰勭畻涓庣┖闂寸害鏉?
### InterventionPlannerAgent

杈撳叆锛?
- Memory01
- 闂嵎缁撴灉
- 闀挎湡璁板繂

杈撳嚭锛?
- 0 鍏冩柟妗?- 浣庢垚鏈柟妗?- 杩涢樁鏂规
- 姣忎釜鏂规鐨勮鍔ㄦ楠?- 姣忎釜鏂规鐨勬敼閫犻€昏緫

### ImagePromptAgent

杈撳叆锛?
- 鍘熷浘鎻忚堪
- 浜烘牸娲炲療
- 闂嵎缁撴灉
- 骞查鏂规

杈撳嚭锛?
- 鍥剧敓鍥?prompt
- 杞存祴鍥?prompt
- 灞€閮ㄧ粏鑺?prompt
- negative prompt

### ImageGenerationTool

杈撳叆锛?
- 鍘熷浘
- image prompt

杈撳嚭锛?
- generated image URLs
- generation status
- provider metadata

### LetterWriterAgent

杈撳叆锛?
- 骞查鏂规
- 鐢ㄦ埛 after 鍥剧墖
- 鐢ㄦ埛鎰熷彈
- 鏈畬鎴愭楠?
杈撳嚭锛?
- 鍛婂埆淇?- 涓嬩竴姝ユ俯鍜岃鍔ㄥ缓璁?
### MemoryCuratorAgent

杈撳叆锛?
- 鏈疆瀹屾暣 session

杈撳嚭锛?
- 闀挎湡璁板繂鏇存柊
- 鐢ㄦ埛鍋忓ソ鏇存柊
- next actions
- 鍙€?feed draft

## 5. LangGraph 宸ヤ綔娴?
鐩爣宸ヤ綔娴侊細

```text
START
  -> load_session
  -> analyze_space_images
  -> generate_questions
  -> wait_for_user_answers
  -> plan_intervention
  -> build_image_prompts
  -> generate_images
  -> save_result
  -> wait_for_feedback
  -> write_letter
  -> update_long_term_memory
  -> create_next_actions
  -> END
```

闇€瑕佹敮鎸佷袱涓殏鍋滅偣锛?
- 绛夊緟鐢ㄦ埛鍥炵瓟闂嵎
- 绛夊緟鐢ㄦ埛涓婁紶鏀归€犵粨鏋滀笌鎰熷彈

姣忎釜鑺傜偣閮藉繀椤诲啓鍏?`workflow_runs`锛屼究浜庢仮澶嶃€佽皟璇曞拰瀹¤銆?
## 6. Planning / Tool Calling / Memory 浣跨敤杈圭晫

### Planning

鐢ㄤ簬锛?
- 鐢熸垚绌洪棿骞查鏂规
- 鎷嗗垎 0 鍏冦€佷綆鎴愭湰銆佽繘闃舵柟妗?- 鐢熸垚 Next Actions
- 鍒ゆ柇棰勭畻銆佸闈€佸叡鐢ㄧ┖闂寸瓑闄愬埗

### Tool Calling

鐢ㄤ簬锛?
- 璋冪敤瑙嗚妯″瀷
- 璋冪敤鍥剧敓鍥炬ā鍨?- 涓婁紶鍥剧墖鍒板璞″瓨鍌?- 璇诲彇鍘嗗彶璁板繂
- 淇濆瓨鐢熸垚鍥剧墖
- 鏌ヨ鐢ㄦ埛鍘嗗彶 session
- 鐢熸垚 Feed 鍗＄墖

### Memory

鐢ㄤ簬锛?
- P001 鍚庡啓鍏ョ┖闂磋瀵?- P002 鍓嶈鍙?Memory01 涓庨棶鍗风粨鏋?- 鍥剧敓鍥惧墠璇诲彇浜烘牸娲炲療涓庢敼閫犵洰鏍?- P003 鍓嶈鍙栨柟妗堜笌鍙嶉
- session 缁撴潫鍚庢洿鏂伴暱鏈熻蹇?- Grow / Next 椤甸潰鐢熸垚涓€у寲鍐呭

## 7. 鎺ㄨ崘鏂囦欢缁撴瀯

```text
backend/
  app/
    main.py

    api/
      routes/
        upload.py
        spaces.py
        sessions.py
        feed.py
        actions.py
        memories.py

    core/
      config.py
      database.py
      llm.py
      storage.py

    db/
      models.py
      schemas.py

    workflows/
      nestai_graph.py
      state.py
      nodes/
        load_session.py
        analyze_space.py
        generate_questions.py
        plan_intervention.py
        build_image_prompts.py
        generate_images.py
        write_letter.py
        update_memory.py
        create_next_actions.py

    agents/
      space_reader/
        system.md
        output_schema.json
      questionnaire/
        system.md
        output_schema.json
      intervention_planner/
        system.md
        output_schema.json
      image_prompt_builder/
        system.md
        output_schema.json
      memory_curator/
        system.md
        output_schema.json
      letter_writer/
        system.md
        output_schema.json

    services/
      vision_service.py
      image_generation_service.py
      memory_service.py
      storage_service.py
      feed_service.py
      action_service.py

    repositories/
      session_repo.py
      space_repo.py
      image_repo.py
      memory_repo.py
      feed_repo.py

frontend/
  src/
    pages/
    components/
    features/
      upload/
      chat/
      result/
      share/
      feed/
      profile/
    lib/
      api.ts
      types.ts
    stores/
```

## 8. 瀹炴柦椤哄簭

### Phase 1: 鏁版嵁鐪熷疄鍖?
鐩爣锛氭牳蹇冮〉闈笉鍐嶄緷璧?mock銆?
浠诲姟锛?
- 鎶?`spaces.py` 浠庡唴瀛樺瓨鍌ㄨ縼绉诲埌 SQLite
- 澧炲姞 Feed / Actions API
- Result 椤甸潰鍙鐪熷疄 `intervention_plan`
- Letter 椤甸潰灞曠ず鐪熷疄 before / after 鍥剧墖
- Grow / Next / Me 浠庣湡瀹?session 娲剧敓鍐呭

### Phase 2: 鍥剧敓鍥鹃棴鐜?
鐩爣锛氱┖闂村共棰勬柟妗堝彲浠ョ敓鎴愮湡瀹炶瑙夌粨鏋溿€?
浠诲姟锛?
- P002 杈撳嚭澧炲姞 `image_prompts`
- 鏂板 `ImagePromptAgent`
- 鏂板 `image_generation_service.py`
- 鏂板 `generated_images` 琛?- Result 椤甸潰灞曠ず鐪熷疄鐢熸垚鍥?- 鍥惧儚鐢熸垚鏀逛负寮傛浠诲姟

### Phase 3: LangGraph 姝ｅ紡鍖?
鐩爣锛氫富娴佺▼鍙樻垚鍙殏鍋溿€佸彲鎭㈠銆佸彲杩借釜鐨勭姸鎬佹満銆?
浠诲姟锛?
- 瀹氫箟缁熶竴 `NestAIState`
- 姣忎釜 Agent 鍙樻垚 LangGraph node
- 姣忎釜鑺傜偣杈撳嚭鍐欏叆 `workflow_runs`
- 鏀寔鐢ㄦ埛杈撳叆鏆傚仠鐐?- 鏀寔鍥惧儚鐢熸垚寮傛鎭㈠
- 鏀寔澶辫触閲嶈瘯涓?fallback

### Phase 4: 闀挎湡璁板繂涓?Grow

鐩爣锛氱敤鎴疯秺鐢ㄨ秺鍑嗭紝Grow 椤甸潰鏈夌湡瀹炲唴瀹广€?
浠诲姟锛?
- session 缁撴潫鍚庣敓鎴?memory summary
- 鏇存柊闀挎湡瀹＄編鍋忓ソ銆侀绠楀亸濂姐€佽鍔ㄤ範鎯?- 鍩轰簬闀挎湡璁板繂鐢熸垚 Next Actions
- 鐢ㄦ埛鎺堟潈鍚庣敓鎴?Feed post
- Grow 椤甸潰鍖哄垎涓汉鎴愰暱璁板綍涓庡叕鍏辨渚?
## 9. 杩戞湡浼樺厛绾?
褰撳墠鏈€搴旇鍏堝仛锛?
```text
SQLite + Local uploads
  -> 鍘绘帀鏍稿績 Mock
  -> 澧炲姞 image prompt schema
  -> 鎺ュ叆鍥剧敓鍥?  -> LangGraph 姝ｅ紡鍖?  -> Grow / Feed / Memory 杩涘寲
```

鍒ゆ柇鏍囧噯锛?
- 鐢ㄦ埛涓婁紶鐨勫浘鐗囧繀椤绘垚涓哄悗缁墍鏈夎緭鍑虹殑鐪熷疄杈撳叆
- 闂嵎缁撴灉蹇呴』褰卞搷骞查鏂规
- 骞查鏂规蹇呴』褰卞搷鍥剧敓鍥?prompt
- 鐢ㄦ埛鍙嶉蹇呴』褰卞搷淇′欢鍜岄暱鏈熻蹇?- Grow / Next / Me 涓嶈兘鍐嶅彧鏄潤鎬?mock

