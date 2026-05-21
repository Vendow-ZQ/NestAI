# NestAI LLM / Prompt 璋冪敤鍦板浘

鏇存柊鏃堕棿锛?026-05-19

## 鍏ュ彛鎬昏

| 闃舵 | 鍓嶇椤甸潰 | 鍓嶇 API | 鍚庣鍏ュ彛 | 鏄惁璋冪敤 LLM / 鍥惧儚 API | Prompt 浣嶇疆 |
| --- | --- | --- | --- | --- | --- |
| P001 鍥剧墖鐞嗚В + 闂嵎 | Upload -> Generating(space) -> Chat | `POST /api/sessions/{id}/analyze` | `python-server/app/api/sessions.py` | 鏄紝瑙嗚 LLM | `prompts/P001_space_analysis.md` |
| P002 绌洪棿骞查鏂规 | Chat -> Generating(intervention) -> Result | `POST /api/sessions/{id}/intervention` | `WorkflowService.run_intervention_generation()` | 鏄紝鏂囨湰 LLM | `python-server/app/prompts/__init__.py:create_p002_prompt()` |
| P004 鍥剧敓鍥炬彁绀鸿瘝缈昏瘧 | Result 鐐瑰嚮鈥滅湅鐪嬪彉鍖栤€?| `POST /api/sessions/{id}/generate-images` | `WorkflowService.run_image_generation()` | 鏄紝澶氭ā鎬?LLM | `prompts/P004_image_prompt.md` |
| 鍥剧敓鍥剧敓鎴?| Result 鐐瑰嚮鈥滅湅鐪嬪彉鍖栤€?| 鍚屼笂 | `image_generation_service.generate_from_original()` | 鏄紝OpenAI Image API | 浣跨敤 P004 鐨勮緭鍑轰綔涓?image edit prompt |
| P003 鍥炰俊 | Share/Done -> Generating(letter) -> Letter | `POST /api/sessions/{id}/letter` | `WorkflowService.run_letter_generation()` | 鏄紝鏂囨湰 LLM | `prompts/P003_reflection_letter.md` |

## P001锛氬浘鐗囩悊瑙ｄ笌鍔ㄦ€侀棶鍗?
璋冪敤閾撅細

1. 鐢ㄦ埛涓婁紶鍥剧墖銆?2. 鍓嶇杩涘叆 `/generating?type=space`銆?3. 鍓嶇璋冪敤 `POST /api/sessions/{session_id}/analyze`銆?4. 鍚庣 `vision_service.analyze_space_image()` 璇诲彇涓婁紶鍥剧墖銆?5. `vision_service` 閫氳繃 `llm_manager.get_model(provider=VISION_LLM_PROVIDER, model_name=VISION_LLM_MODEL)` 璋冪敤瑙嗚妯″瀷銆?
绯荤粺 Prompt锛?
- `prompts/P001_space_analysis.md`

杈撳叆锛?
- 涓婁紶鐨勫師濮嬬┖闂村浘鐗囷紱
- 涓€鍙?human 鎸囦护锛岃姹傝緭鍑?Memory01銆丵A銆丣SON銆?
杈撳嚭锛?
- `space_summary`锛氬唴閮?Memory01锛岀敤浜庡悗缁柟妗堢敓鎴愶紱
- `questions`锛氬墠绔睍绀虹殑 3 閬撳姩鎬侀棶鍗凤紱
- `qa_markdown`锛氳皟璇?杩囩▼鍐呭锛屼笉搴旇鐩存帴瀹屾暣灞曠ず鍦ㄥ墠绔€?
## P002锛氱┖闂村共棰勬柟妗?
璋冪敤閾撅細

1. 鐢ㄦ埛鍦?Chat 椤甸潰瀹屾垚闂嵎銆?2. 鍓嶇璋冪敤 `POST /api/sessions/{session_id}/intervention`銆?3. `WorkflowService.run_intervention_generation()` 鍚姩 LangGraph銆?4. Graph 鑺傜偣 `plan_intervention_node()` 璋冪敤鏂囨湰 LLM銆?
绯荤粺 Prompt锛?
- `python-server/app/prompts/__init__.py`
- 鍑芥暟锛歚create_p002_prompt()`

杈撳叆锛?
- P001 鐨?`space_summary`锛?- 闂嵎绛旀锛歚aspiration`銆乣current_state`銆乣constraints`銆?
杈撳嚭锛?
- 涓夋。鏂规锛歚free`銆乣low`銆乣advanced`銆?
## P004锛氫粠琛屽姩鏂囨湰鍒板浘鐢熷浘 Prompt

璋冪敤閾撅細

1. 鐢ㄦ埛鍦?Result 椤甸潰鐐瑰嚮鈥滅湅鐪嬪彉鍖栤€濄€?2. 鍓嶇璋冪敤 `POST /api/sessions/{session_id}/generate-images`銆?3. `WorkflowService.run_image_generation()` 鍚姩鍥惧儚鐢熸垚 Graph銆?4. Graph 鑺傜偣 `build_image_prompt_node()` 鍏堣鍙栧綋鍓嶉€夋嫨鐨?tier锛屼緥濡?`low`銆?5. 鑺傜偣鎶娾€滅┖闂存敼閫犺鍔ㄦ枃鏈?+ 鏀归€犲墠鍥剧墖鈥濅竴璧峰彂缁欏妯℃€?LLM銆?
绯荤粺 Prompt锛?
- `prompts/P004_image_prompt.md`

杈撳叆锛?
- 褰撳墠 tier 鐨勮鍔ㄦ枃鏈紱
- 鏀归€犲墠鍥剧墖锛?- 鐢ㄦ埛闂嵎/绌洪棿鎽樿鐨勪笂涓嬫枃銆?
杈撳嚭锛?
- `render1`
- `axonometric`
- `render2`
- `negative`

杩欎簺杈撳嚭涓嶆槸鏈€缁堝浘鐗囷紝鑰屾槸鍙戠粰鍥剧敓鍥炬ā鍨嬬殑 image edit prompt銆?
## 鍥剧敓鍥剧敓鎴?
璋冪敤閾撅細

1. `build_image_prompt_node()` 寰楀埌 P004 缈昏瘧鍚庣殑 `imagePrompts`銆?2. Graph 鑺傜偣 `generate_images_node()` 璋冪敤 `image_generation_service.generate_from_original()`銆?3. 褰撳墠閰嶇疆浣跨敤 OpenAI Image API銆?
閰嶇疆锛?
- `IMAGE_PROVIDER=OPENAI`
- `IMAGE_MODEL=gpt-image-1.5`

杈撳嚭锛?
- 鐢熸垚鍥句繚瀛樺埌 `python-server/uploads/generated/YYYYMMDD/`銆?- 鍓嶇閫氳繃 `/uploads/generated/...` 灞曠ず銆?
澶辫触璋冭瘯锛?
- 鍥惧儚鐢熸垚澶辫触浼氬啓鍏?`python-server/uploads/debug/`銆?
## P003锛氬畬鎴愬悗鐨勫洖淇?
璋冪敤閾撅細

1. 鐢ㄦ埛鍦?Next/Result/Share 娴佺▼閲屾彁浜ゅ畬鎴愮姸鎬佸拰鎰熷彈銆?2. 鍓嶇璋冪敤 `POST /api/sessions/{session_id}/letter`銆?3. `WorkflowService.run_letter_generation()` 鍚姩 Letter Graph銆?4. Graph 鑺傜偣 `write_letter_node()` 璋冪敤鏂囨湰 LLM銆?
绯荤粺 Prompt锛?
- `prompts/P003_reflection_letter.md`

杈撳叆锛?
- 鐢ㄦ埛閫夋嫨鐨?tier锛?- 瀵瑰簲绌洪棿骞查鏂规锛?- 瀹屾垚鎯呭喌锛?- 鐢ㄦ埛鎰熷彈锛?- 瀵硅瘽鎽樿銆?
杈撳嚭锛?
- 涓€灏?4-7 娈电殑涓枃鍥炰俊锛屼繚瀛樺埌 session memory銆?
## 鐜板湪鐨?LangGraph 缁撴瀯

褰撳墠涓嶆槸鈥滃緢澶氱嫭绔?Agent 浜掔浉鑱婂ぉ鈥濈殑澶?Agent 绯荤粺锛岃€屾槸涓€涓?LangGraph 缂栨帓鐨勫鑺傜偣宸ヤ綔娴侊細

- `intervention_graph`锛氱敓鎴愮┖闂村共棰勬柟妗堬紝鍐嶅噯澶囧浘鐗?Prompt锛?- `image_generation_graph`锛氱敤 P004 缈昏瘧鍥剧敓鍥?Prompt锛屽啀璋冪敤鍥惧儚鐢熸垚 API锛?- `letter_graph`锛氱敓鎴愬洖淇★紝鍐嶅噯澶囪蹇嗘洿鏂般€?
瀹冩洿鍍忊€滃崟鍗忚皟鍣?+ 澶氳兘鍔涜妭鐐光€濈殑浜у搧宸ヤ綔娴併€傜幇闃舵杩欐牱鏇寸ǔ銆佹洿杞伙紝涓嶉渶瑕佽繃鏃╁仛鎴愬鏉傚 Agent銆?
