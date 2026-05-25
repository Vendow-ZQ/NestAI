# NestAI 褰撳墠寮€鍙戣繘搴︿笌浜у搧鏋舵瀯鎬昏

鏇存柊鏃堕棿锛?026-05-26  
鐢ㄩ€旓細鍚屾浜у搧銆佽璁°€佸伐绋嬩笌鍚庣画 Agent 鎺ユ墜寮€鍙戙€? 

---

## 1. 褰撳墠寮€鍙戣繘搴?
NestAI 鐜板湪宸茬粡浠庘€滃墠绔?mock 婕旂ず鈥濇帹杩涘埌鈥滅湡瀹炲墠鍚庣 + 鐪熷疄 LLM + 鐪熷疄鏁版嵁搴?鏂囦欢瀛樺偍 + 鍒嗘 LangGraph workflow鈥濈殑闃舵銆傛牳蹇冮摼璺凡缁忚兘璐€氾細

```text
涓婁紶绌洪棿鍥剧墖
  -> 鍚庣淇濆瓨鍥剧墖
  -> 鍒涘缓 Space / Session
  -> P001 鍥剧墖鐞嗚В涓?Memory01
  -> 鍔ㄦ€侀棶鍗?  -> 鐢ㄦ埛鍥炵瓟闂嵎
  -> P002 涓夋。绌洪棿骞查鏂规
  -> Result 灞曠ず鏂规
  -> P004 鎶婃柟妗堢炕璇戞垚鍥剧敓鍥?Prompt
  -> OpenAI image edit 鐢熸垚鏀归€犳晥鏋滃浘
  -> 鏀惰棌鍒?Next
  -> Share Changes 涓婁紶鍙嶉
  -> P003 鐢熸垚 Letter
  -> 鏇存柊闀挎湡 Memory
  -> 鍙彂甯冨埌 Grow Feed
```

### 宸茬粡瀹屾垚

- 鍓嶇涓婚〉闈細Grow銆乁pload銆丟enerating銆丆hat銆丷esult銆丯ext銆丼hare銆丩etter銆丮e銆?- 鍓嶇椋庢牸锛氭暣浣撳悜 Apple 椋庢牸鏀舵暃锛岀Щ鍔?Web App 瀹瑰櫒銆佸簳閮?Tab銆佺（鐮傜幓鐠冦€佸崱鐗囩鍚搞€丗eed 妯＄硦鑱氱劍銆侀〉闈㈣浆鍦哄凡寤虹珛銆?- Nobi锛氫笂浼犲崱鐗?Nobi銆佸姞杞介〉 Nobi frame 鍔ㄧ敾銆侀棶鍗峰姞杞?缁撴灉鍔犺浇/鏁堟灉鍥剧敓鎴愪笁绫荤礌鏉愯矾寰勫凡寤虹珛銆?- 涓婁紶閾捐矾锛氬墠绔笂浼犲鍥撅紝鍚庣淇濆瓨锛屽垱寤?Space 鍜?Session銆?- P001锛氬浘鐗囩悊瑙ｈ蛋 `VisionService`锛屼娇鐢?`prompts/P001_space_analysis.md`锛屾嫆绛旀椂璧?`P001_retry_safe_space.md`銆?- 闂嵎锛氱敱 P001 鍥剧墖鐞嗚В缁撴灉鐢熸垚锛屼笉鍐嶄娇鐢ㄥ浐瀹?mock 闂嵎銆?- P002锛氶棶鍗风粨鏋?+ Memory01 + 闀挎湡 Memory compact context 鐢熸垚涓夋。骞查鏂规銆?- Result锛氭敮鎸?0 鍏?/ 浣庢垚鏈?/ 杩涢樁涓夋。鍒囨崲锛屾敮鎸佲€滅湅鐪嬫晥鏋溾€濈敓鎴愮湡瀹炴晥鏋滃浘銆?- P004锛氭妸閫変腑鐨勬柟妗堝姩浣滄枃鏈?+ 鍘熷浘缈昏瘧鎴愬浘鐢熷浘 XML prompt銆?- 鍥剧敓鍥撅細鍚庣 `ImageGenerationService` 宸叉帴 OpenAI image edit锛屾敮鎸佸師鍥惧綊涓€鍖栥€佷繚鐣欎笂浼犲浘鐗囨瘮渚嬨€佷繚瀛樼敓鎴愬浘銆?- Next锛氱湡瀹炰粠 session / intervention 娲剧敓锛屾敮鎸?Done锛屽崱鐗囧姩鏁堛€侀暱鎸夋嫋鍔ㄥ垹闄ら€昏緫宸插仛銆?- Feed锛氭湁鐪熷疄 `feed_posts` 琛紱Letter 椤靛垎浜埌 Grow 浼氬啓鍏ユ暟鎹簱骞跺嚭鐜板湪 Grow Feed銆?- Share / Letter锛氬弽棣堣緭鍏ャ€乤fter image銆佹湭瀹屾垚姝ラ銆乴etter 淇濆瓨鍒?session銆?- Memory锛氱煭鏈?memory 鍐欏叆 session锛涢暱鏈?memory 鍐欏叆鏁版嵁搴撳苟鍚屾鎴?Markdown 鏂囦欢銆?- LangGraph锛氬凡寤虹珛 intervention銆乴etter銆乮mage prompt銆乮mage generation 鍥涗釜鍒嗘 graph銆?- 涓€閿惎鍔細宸叉湁 `pnpm dev`銆乣start.ps1`銆乣start.bat`銆?- 閮ㄧ讲鍩虹锛氬凡鏈?`render.yaml`銆乣vercel.json`锛屾敮鎸?Render + Vercel + Supabase 鐨勭洰鏍囬儴缃茶矾绾裤€?
### 浠嶆湭瀹屽叏瀹屾垚 / 闇€瑕佺户缁墦纾?
- 鏁存潯 LangGraph 杩樹笉鏄竴涓畬鏁村彲鏆傚仠/鎭㈠鐨勫ぇ鍥撅紝鐩墠鏄寜闃舵鎷嗘垚澶氫釜 graph銆?- 澶氱敤鎴蜂綋绯讳粛鏄?MVP 褰㈡€侊紝榛樿 `dev_user`锛岃繕娌℃湁鐧诲綍銆佹潈闄愩€佺敤鎴烽殧绂汇€?- Feed 鐜板湪鍏峰鐪熷疄鏁版嵁搴擄紝浣嗙ぞ鍖哄叧绯汇€佺偣璧炪€佽瘎璁恒€佹帹鑽愭帓搴忓皻鏈仛銆?- Me 椤甸暱鏈?Memory 鍙煡鐪嬶紝浣嗙紪杈戙€佺‘璁ゃ€佸垹闄ゃ€侀殣绉佹帶鍒惰繕闇€瑕佷骇鍝佸寲銆?- P001/P002/P003/P004 鐨勮緭鍑?schema 浠嶉渶瑕佹洿涓ユ牸鐨?JSON Schema 鏍￠獙鍜屽け璐ラ噸璇曘€?- 鍥剧敓鍥惧凡缁忕湡瀹炴帴鍏ワ紝浣嗛鏍肩ǔ瀹氭€с€乸rompt 鍙帶鎬с€佺敓鎴愯€楁椂鍙嶉浠嶉渶瑕佺户缁皟鍙傘€?- 鍚庣鏈夐儴鍒嗗巻鍙蹭腑鏂囨敞閲?瀛楃涓插湪缁堢涓樉绀轰贡鐮侊紝闇€瑕侀€愭娓呯悊缂栫爜鍜屾枃妗堛€?- 娴嬭瘯瑕嗙洊杩樹笉瓒筹紝灏ゅ叾鏄伐浣滄祦鑺傜偣銆丄PI 鍥炲綊銆佸墠绔叧閿梾绋?E2E銆?
---

## 2. 鐢ㄦ埛鐥涚偣

NestAI 鐨勭敤鎴蜂笉鏄湪鎵句竴涓€滆淇伐鍏封€濓紝鑰屾槸鍦ㄦ壘涓€绉嶄綆鍘嬪姏鍦扮悊瑙ｈ嚜宸便€佹敼鍙樼┖闂淬€佹敼鍙樼敓娲荤姸鎬佺殑鏂规硶銆?
鏍稿績鐥涚偣锛?
- 涓嶇煡閬撹嚜宸辩殑绌洪棿涓轰粈涔堚€滀笉瀵瑰姴鈥濓紝鍙劅瑙変贡銆佸牭銆佺疮銆佹病鏈夎兘閲忋€?- 鎯虫敼鍙樻埧闂达紝浣嗕笉鐭ラ亾浠庡摢閲屽紑濮嬶紝瀹规槗琚ぇ宸ョ▼銆佸ぇ棰勭畻鍚撻€€銆?- 鐪嬩簡寰堝瀹跺眳鐏垫劅鍥撅紝浣嗗拰鑷繁鐨勭湡瀹炴埧闂淬€侀绠椼€佺鎴块檺鍒朵笉鍖归厤銆?- 鏁寸悊銆佹敼閫犮€佸竷缃父甯稿仠鐣欏湪鏀惰棌澶癸紝娌℃湁鍙樻垚浠婃櫄灏辫兘鍋氱殑灏忚鍔ㄣ€?- 鐢ㄦ埛甯屾湜琚悊瑙ｏ紝鑰屼笉鏄瀹″垽銆傜┖闂存贩涔辫儗鍚庡彲鑳芥槸鍘嬪姏銆佽韩浠藉彉鍖栥€佺敓娲昏妭濂忥紝涓嶅彧鏄€滀笉浼氭敹绾斥€濄€?- 鐢ㄦ埛甯屾湜瓒婄敤瓒婃噦鑷繁锛岃€屼笉鏄瘡娆￠兘鍍忕涓€娆℃墦寮€涓€涓伐鍏枫€?
---

## 3. 鐢ㄦ埛闇€姹?
### 鏄炬€ч渶姹?
- 涓婁紶鑷繁鐨勭湡瀹炵┖闂村浘鐗囥€?- 寰楀埌涓€鍙ユ俯鏌斻€佸噯纭€侀潪璇勫垽鐨勭┖闂磋瀵熴€?- 寰楀埌鍩轰簬鍥剧墖鐨勫姩鎬侀棶鍗凤紝鑰屼笉鏄浐瀹氶棶鍗枫€?- 寰楀埌 0 鍏冦€佷綆鎴愭湰銆佽繘闃朵笁妗ｆ敼閫犳柟妗堛€?- 鐪嬪埌鏀归€犲悗鐨勮瑙夋晥鏋滃浘銆?- 鏀惰棌涓€涓彲鎵ц鐨?Next action銆?- 瀹屾垚鍚庤兘涓婁紶鍙樺寲鍥俱€佽褰曟劅鍙椼€佺敓鎴愬洖淇°€?- 鍦?Me 椤电湅鍒拌嚜宸辩殑闀挎湡绌洪棿璁板繂銆?
### 闅愭€ч渶姹?
- 甯屾湜绯荤粺璁板緱鑷繁鐨勫缇庛€侀绠椼€佷範鎯拰绌洪棿闄愬埗銆?- 甯屾湜鏀归€犲缓璁笉鏄€滄紓浜絾鏃犲叧鈥濓紝鑰屾槸鍜岃嚜宸辩殑鐢熸椿鐘舵€佹湁鍏炽€?- 甯屾湜 AI 鐨勮姘斿儚涓€涓噦鐢熸椿鐨勯櫔浼磋€咃紝涓嶅儚瑁呬慨閿€鍞垨鍐峰啺鍐板垎鏋愬笀銆?- 甯屾湜 Nobi 鎴愪负涓€涓綆渚靛叆銆佸彲鐖辩殑鎯呯华缂撳啿瑙掕壊銆?- 甯屾湜浜у搧鐪嬭捣鏉ュ彲淇°€佺簿鑷淬€佹湁鏈潵鎰燂紝鑰屼笉鏄粔浠?AI demo銆?
---

## 4. 浜у搧绛栫暐

NestAI 褰撳墠搴斿潥鎸佲€滃皬鑰屽畬鏁粹€濈殑绛栫暐锛氬厛鎶婁竴涓汉浠庝笂浼犲埌瀹屾垚涓€娆＄┖闂磋鍔ㄧ殑闂幆璺戦€氾紝鍐嶆墿澶т负绀惧尯鍜岄暱鏈熸垚闀跨郴缁熴€?
### MVP 绛栫暐

- 灏戜簯鏈嶅姟锛氭湰鍦?SQLite + 鏈湴 uploads 鍗冲彲璺戦€氾紱鐢熶骇鍐嶆帴 Supabase / Render / Vercel銆?- 灏戞ā鍨嬪垎鍙夛細榛樿 OpenAI 浼樺厛锛孡LM銆乂ision銆両mage 閮借蛋缁熶竴閰嶇疆銆?- 灏戦〉闈㈠爢鍙狅細姣忎釜椤甸潰蹇呴』鎵挎媴鐪熷疄娴佺▼鑺傜偣锛屼笉鍋氱┖瀵艰埅銆?- 灏?mock锛欸row銆丯ext銆丮e銆丩etter 閮介€愭浠庣湡瀹?session / DB 娲剧敓銆?- 寮洪棴鐜細姣忔涓婁紶閮藉簲璇ヤ骇鐢熸柟妗堛€佽鍔ㄣ€佸弽棣堛€侀暱鏈熻蹇嗐€?
### 澧為暱绛栫暐

- 鍏堣鐢ㄦ埛鎰熷埌鈥滃畠鐪熺殑鐪嬭浜嗘垜鐨勭┖闂粹€濄€?- 鍐嶈鐢ㄦ埛鎰熷埌鈥滃畠鐪熺殑缁欎簡鎴戜粖鏅氳兘鍋氱殑浜嬧€濄€?- 鍐嶈鐢ㄦ埛鎰熷埌鈥滃畠璁板緱鎴戯紝涓嬩竴娆℃洿鎳傛垜鈥濄€?- 鏈€鍚?Grow Feed 鎵嶆垚涓虹ぞ鍖猴紝鑰屼笉鏄竴寮€濮嬪氨鍋氭硾鍐呭娴併€?
---

## 5. 浜у搧鍝插

NestAI 鐨勬牳蹇冧笉鏄€滄妸鎴块棿鍙樺ソ鐪嬧€濓紝鑰屾槸鈥滆绌洪棿鏀寔涓€涓汉姝ｅ湪鎴愪负鐨勭敓娲烩€濄€?
鍑犱釜鍘熷垯锛?
- **浠庣湡瀹炵┖闂村嚭鍙?*锛氫笂浼犲浘鐗囨槸绗竴鎬ц緭鍏ワ紝鍚庣画闂嵎銆佹柟妗堛€乸rompt銆佹晥鏋滃浘閮藉簲琚浘鐗囩害鏉熴€?- **浠庡皬琛屽姩鍑哄彂**锛? 鍏冩柟妗堜笉鏄急鏂规锛岃€屾槸闄嶄綆琛屽姩闃诲姏鐨勫叧閿€?- **浠庨櫔浼村嚭鍙?*锛氳姘旇娓╂煍銆佸叿浣撱€侀潪璇勫垽銆?- **浠庨暱鏈熷叧绯诲嚭鍙?*锛歁emory 涓嶆槸鎶€鏈櫛澶达紝鑰屾槸鈥滆秺鐢ㄨ秺鎳備綘鈥濈殑浜у搧鍩虹銆?- **浠庤瑙夊彲淇″嚭鍙?*锛氱敓鎴愬浘蹇呴』淇濇寔鍘熺┖闂寸粨鏋勩€佽瑙掋€佹瘮渚嬶紝涓嶈兘鍙樻垚鏃犲叧鏍锋澘闂淬€?- **浠?Nobi 鍑哄彂**锛歂obi 鏄儏缁帴鍙ｏ紝涓嶆槸瑁呴グ璐寸焊銆傚畠搴旇鍦ㄧ敤鎴风瓑寰呫€佺姽璞€佽鍔ㄦ椂鍑虹幇锛岄檷浣庣郴缁熸劅銆?
---

## 6. 涓昏鍔熻兘

### Grow

- 棣栭〉 Feed銆?- 椤堕儴涓婁紶鍏ュ彛鍗＄墖銆?- Feed 鍗＄墖纾佸惛婊氬姩锛屽綋鍓嶅崱鐗囨竻鏅帮紝涓婁笅鍗＄墖杞诲井妯＄硦銆?- 鍙睍绀虹湡瀹炴暟鎹簱閲岀殑 feed posts銆?- 涓婁紶鍏ュ彛鏂囨褰撳墠涓猴細
  - `Growing...`
  - `See Your Nest, See Your Next`
  - `Hi~鎴戞槸Nobi锛乣
  - `璁╂垜鐪嬬湅浣犵殑灏忕獫鍚э紝鎴戣兘甯綘鏀归€犲畠锛乣

### Upload

- 澶氬浘鐗囦笂浼犮€?- 涓婁紶妗嗕笌 Grow 涓婁紶鍗＄墖淇濇寔涓€鑷淬€?- 涓婁紶鍚?Nobi 闅愯棌锛屽浘鐗囧～婊″崱鐗囥€?- 鏀寔缂╃暐鍥惧垹闄ゃ€佺偣鍑绘煡鐪嬪ぇ鍥俱€?- 鐐瑰嚮寮€濮嬪垎鏋愬悗杩涘叆 Generating銆?
### Generating

- 绌洪棿璇嗗埆鍔犺浇椤点€?- 璋冪敤 `/api/sessions/{session_id}/analyze`銆?- 鏄剧ず Nobi working frames銆?- 鑳屾櫙涓虹函鐧斤紝閬垮厤杩囧害瑙嗚鍣煶銆?
### Chat

- 灞曠ず P001 鐨勫墠绔竴鍙ヨ瘽绌洪棿姒傝堪銆?- 灞曠ず P001 鐢熸垚鐨勪笁閬撳姩鎬侀棶棰樸€?- 鐢ㄦ埛鍥炵瓟鍚庢彁浜ょ粰 P002銆?
### Result

- 灞曠ず涓婁紶鍘熷浘銆?- 灞曠ず涓夋。鏂规锛? 鍏冦€佷綆鎴愭湰銆佽繘闃躲€?- 鐐瑰嚮鈥滅湅鐪嬫晥鏋溾€濆悗锛?  - 鐢?P004 鎶婂綋鍓嶆。浣嶆柟妗堢炕璇戞垚 image edit prompt銆?  - 璋?OpenAI image edit銆?  - 鐢熸垚鍥句繚瀛樺苟灞曠ず銆?  - 鏀寔妯悜婊戝姩鏌ョ湅鏀归€犲墠/鏀归€犲悗銆?- 鍥剧墖鍙偣鍑绘斁澶с€?
### Next

- 鏀惰棌鐢ㄦ埛鍐冲畾瑕佸仛鐨勭┖闂磋鍔ㄣ€?- Done 浠ｈ〃鐢ㄦ埛瀹屾垚鎴栬繘鍏ュ弽棣堛€?- 鏀寔鍗＄墖鑱氱劍鍔ㄦ晥銆侀暱鎸夊彸鎷栧垹闄ゃ€?
### Share Changes

- 涓婁紶 after image銆?- 杈撳叆鎰熷彈銆?- 杈撳叆鈥滃摢涓€姝ユ病鍋氬埌鈥濄€?- 鎻愪氦鍚庤繘鍏?Letter銆?
### Letter

- P003 鏍规嵁鏂规銆佸弽棣堛€乤fter image銆佹湭瀹屾垚姝ラ鐢熸垚鍥炰俊銆?- Letter 淇濆瓨鍒?session銆?- 鍙彂甯冨埌 Grow Feed锛屽彂甯冨悗鍐欏叆 `feed_posts`銆?
### Me

- 鏌ョ湅涓汉绌洪棿銆侀暱鏈?Memory銆?- 闀挎湡 Memory 褰撳墠鐢卞悗绔敓鎴?Markdown 鏂囦欢銆?
---

## 7. 鐢ㄦ埛鏃呯▼

```text
1. 鐢ㄦ埛鎵撳紑 Grow
2. 鐪嬭 Nobi 涓婁紶鍏ュ彛
3. 鐐瑰嚮涓婁紶鍏ュ彛杩涘叆 Upload
4. 涓婁紶 1-9 寮犵┖闂村浘鐗?5. 鐐瑰嚮寮€濮嬪垎鏋?6. 杩涘叆绌洪棿璇嗗埆鍔犺浇椤?7. P001 璇诲彇鍥剧墖锛岀敓鎴?Memory01 + 涓€鍙ヨ瘽姒傝堪 + 鍔ㄦ€侀棶鍗?8. 鐢ㄦ埛鍥炵瓟闂嵎
9. P002 鐢熸垚涓夋。绌洪棿骞查鏂规
10. 鐢ㄦ埛鍦?Result 鏌ョ湅鏂规
11. 鐢ㄦ埛鐐瑰嚮鈥滅湅鐪嬫晥鏋溾€?12. P004 鐢熸垚鍥剧敓鍥?prompt锛孖mageGenerationService 璋?OpenAI 鐢熸垚 after image
13. 鐢ㄦ埛閫夋嫨涓€涓柟妗堟敹鍏?Next
14. 鐢ㄦ埛鎵ц琛屽姩
15. 鐢ㄦ埛鍦?Share Changes 涓婁紶鍙樺寲鍥惧拰鎰熷彈
16. P003 鐢熸垚 Letter
17. 绯荤粺鏇存柊闀挎湡 Memory
18. 鐢ㄦ埛鍙妸鎴愭灉鍒嗕韩鍒?Grow Feed
```

---

## 8. 鎶€鏈灦鏋?
### 鎬讳綋鏋舵瀯

```text
frontend/ React + Vite + TypeScript + Tailwind + Zustand
  |
  | REST API
  v
backend/ FastAPI
  |
  +-- API routes
  +-- MemoryService
  +-- StorageService
  +-- VisionService
  +-- WorkflowService
  +-- ImageGenerationService
  |
  +-- LangGraph stage graphs
  |
  +-- SQLite / Postgres
  +-- local uploads / Supabase Storage
  +-- OpenAI / Gemini / Kimi via LLMManager
```

### 鍓嶇

- 鐩綍锛歚frontend/`
- 妗嗘灦锛歊eact + Vite + TypeScript銆?- 鏍峰紡锛歍ailwind + `frontend/src/index.css` 涓殑鑷畾涔?Apple-like design tokens銆?- 鐘舵€侊細Zustand stores銆?- API锛歚frontend/src/lib/api.ts`銆?- 璺敱锛歚frontend/src/App.tsx`銆?
### 鍚庣

- 鐩綍锛歚backend/`
- 妗嗘灦锛欶astAPI銆?- API锛?  - `upload.py`
  - `spaces.py`
  - `sessions.py`
  - `memory.py`
- 閰嶇疆锛?  - `app/core/config.py`
  - `app/core/llm_manager.py`
- 鏈嶅姟锛?  - `VisionService`
  - `WorkflowService`
  - `ImageGenerationService`
  - `MemoryService`
  - `StorageService`

### 瀛樺偍

鏈湴寮€鍙戯細

```text
SQLite:
  backend/nestai.db 鎴栭厤缃殑 sqlite database_url

鍥剧墖:
  backend/uploads/
  .uploads/
  uploads/
```

鐢熶骇鐩爣锛?
```text
Postgres:
  Supabase Postgres via DATABASE_URL

Object Storage:
  Supabase Storage via STORAGE_BACKEND=supabase
```

---

## 9. Agent Pipeline

褰撳墠椤圭洰涓嶆槸鈥滆嚜鐢辫亰澶╁紡澶?Agent 绯荤粺鈥濓紝鑰屾槸鈥滀骇鍝佸伐浣滄祦寮忓 Agent 鑺傜偣绯荤粺鈥濄€傛瘡涓?Agent 鑺傜偣鐢?prompt銆佽緭鍏ヤ笂涓嬫枃銆佽緭鍑?schema銆乫allback 閫昏緫缁勬垚锛屽啀鐢?WorkflowService / LangGraph 涓叉帴銆?
### 褰撳墠瀹為檯 Agent / 鑺傜偣

#### SpaceReader / P001

- 瀹炵幇锛歚VisionService`
- Prompt锛歚prompts/P001_space_analysis.md`
- Retry Prompt锛歚prompts/P001_retry_safe_space.md`
- 杈撳叆锛?  - 涓婁紶鍥剧墖
  - compact long-term memory
- 杈撳嚭锛?  - Memory01
  - 鍓嶇涓€鍙ヨ瘽姒傝堪
  - 鍔ㄦ€侀棶鍗?  - personality insights

#### InterventionPlanner / P002

- 瀹炵幇锛歚plan_intervention_node`
- Prompt锛歚prompts/P002_intervention_plan.md`
- 杈撳叆锛?  - Memory01 / space_summary
  - 闂嵎绛旀
  - long_term_context
- 杈撳嚭锛?  - `free`
  - `low`
  - `advanced`
  - 姣忔。鍖呭惈 title銆乨iagnosis銆乧hanges銆乫irstSteps銆乺ecommendations銆乧ostRange銆乪stimatedTime 绛夈€?
#### ImagePromptTranslator / P004

- 瀹炵幇锛歚build_image_prompt_node`
- Prompt锛歚prompts/P004_image_prompt.md`
- 杈撳叆锛?  - 鍘熷浘
  - 閫変腑妗ｄ綅鐨勮鍔ㄦ柟妗堟枃鏈?  - Memory01 鎽樿
  - 闂嵎缁撴灉
  - long-term compact memory
- 杈撳嚭锛?  - `render1`
  - `axonometric`
  - `render2`
  - `negative`

褰撳墠鍓嶇涓昏鍙睍绀?`render1`銆?
#### ImageGenerationTool

- 瀹炵幇锛歚ImageGenerationService`
- 妯″瀷锛氱敱 `.env` 涓?`IMAGE_MODEL` 閰嶇疆锛屽綋鍓嶇洰鏍囨槸 OpenAI image edit銆?- 杈撳叆锛?  - 鍘熷浘鏂囦欢
  - P004 鐢熸垚鐨?XML image-edit prompt
- 杈撳嚭锛?  - generated image URL
  - 鍐欏洖 intervention plan 鐨?`generatedImages.render1` 鍜?`afterImage`

#### LetterWriter / P003

- 瀹炵幇锛歚write_letter_node`
- Prompt锛歚prompts/P003_reflection_letter.md`
- 杈撳叆锛?  - selected_level
  - selected intervention plan
  - 鐢ㄦ埛瀹屾垚鐘舵€?  - 鐢ㄦ埛鎰熷彈
  - after images
  - long-term compact memory
- 杈撳嚭锛?  - farewell letter

#### MemoryCurator

- 瀹炵幇锛歚update_memory_summary_node` + `MemoryService.update_long_term_memory`
- 褰撳墠杩樻瘮杈冭交閲忥紝鍙妸鏈疆 selected level銆乸lan title銆乫irst step銆乽ser feeling 鍐欏叆闀挎湡璁板繂銆?- 鍚庣画搴斿寮轰负鐙珛 MemoryCuratorAgent锛屽仛鍋忓ソ鎻愬彇銆佽涓烘ā寮忔彁鍙栥€佺┖闂村巻鍙叉洿鏂般€?
### 褰撳墠 LangGraph

鏂囦欢锛歚backend/app/workflows/nestai_graph.py`

褰撳墠鏄洓涓垎娈靛浘锛?
```text
create_intervention_graph:
  plan_intervention -> build_image_prompts -> END

create_letter_graph:
  write_letter -> update_memory_summary -> END

create_image_prompt_graph:
  build_image_prompts -> END

create_image_generation_graph:
  build_image_prompts -> generate_images -> END
```

涓嬩竴姝ョ洰鏍囨槸鍚堝苟涓哄彲鏆傚仠/鎭㈠鐨勫ぇ鍥撅細

```text
upload
  -> P001
  -> wait_user_questionnaire
  -> P002
  -> wait_user_generate_image
  -> P004
  -> image_generation
  -> wait_user_feedback
  -> P003
  -> update_long_term_memory
  -> feed/next publish
```

---

## 10. Prompt 宸ョ▼

Prompt 鏂囦欢缁熶竴鏀惧湪鏍圭洰褰?`prompts/`銆?
```text
prompts/
  P001_space_analysis.md
  P001_retry_safe_space.md
  P002_intervention_plan.md
  P003_reflection_letter.md
  P004_image_prompt.md
  P005_bauhaus_image_edit.md
```

### P001锛氱┖闂寸悊瑙ｄ笌鍔ㄦ€侀棶鍗?
鑱岃矗锛?
- 涓嶅彧璇嗗埆鐗╁搧锛岃繕瑕佺悊瑙ｇ┖闂村姛鑳姐€佽瑙夎礋鑽枫€佹儏缁嚎绱€佽涓洪樆濉炪€?- 杈撳嚭 Memory01銆?- 杈撳嚭鍓嶇涓€鍙ヨ瘽姒傝堪锛岄伩鍏嶆妸鍐呴儴 Memory01 鏆撮湶缁欑敤鎴枫€?- 杈撳嚭 3 閬撳姩鎬侀棶鍗凤紝姣忛 4 涓€夐」銆?
娉ㄦ剰锛?
- P001 涓嶅簲璇ヨ繃搴﹀績鐞嗚瘖鏂€?- 鍓嶇鍙睍绀轰竴鍙ユ俯鏌旇瀵燂紝涓嶅睍绀鸿繃绋嬫枃浠躲€?- 濡傛灉妯″瀷鎷掔瓟锛屼娇鐢?`P001_retry_safe_space.md` 鍋?space-only retry銆?
### P002锛氱┖闂村共棰勬柟妗?
鑱岃矗锛?
- 鏍规嵁 Memory01 + 闂嵎缁撴灉 + 闀挎湡璁板繂鐢熸垚涓夋。鏂规銆?- 涓夋。涓嶆槸涓変欢瀹屽叏涓嶅悓鐨勪簨锛岃€屽簲璇ュ洿缁曚竴涓牳蹇冨共棰勬剰鍥鹃€掕繘銆?- 杈撳嚭蹇呴』鍙鍓嶇鍥哄畾 schema 娑堣垂銆?
Prompt Engineering 閲嶇偣锛?
- 鎺у埗鈥? 鍏冩柟妗堚€濈殑璐ㄩ噺锛屼笉鑳藉彧鏄€滄暣鐞嗕竴涓嬧€濄€?- 鎺у埗鈥滀綆鎴愭湰鏂规鈥濈殑鍙墽琛岀墿浠舵暟閲忓拰棰勭畻銆?- 鎺у埗鈥滆繘闃舵柟妗堚€濅笉瑕佸彉鎴愬ぇ瑁呬慨銆?- 姣忔。閮借鑳借嚜鐒剁炕璇戞垚鍥剧敓鍥?prompt銆?
### P003锛氬弽棣堝洖淇?
鑱岃矗锛?
- 鏍规嵁鐢ㄦ埛鏄惁瀹屾垚銆佸畬鎴愬悗鐨勬劅鍙椼€佸彉鍖栧浘鐗囥€佹湭瀹屾垚姝ラ鍐欏洖淇°€?- 璇皵搴斿儚 Nobi / NestAI 鐨勯櫔浼村紡鍙嶉锛屼笉鏄鐩樻姤鍛娿€?- 杈撳嚭 letter锛屽苟涓洪暱鏈?memory 鎻愪緵鏇存柊绾跨储銆?
### P004锛氭柟妗堝埌鍥剧敓鍥?Prompt

鑱岃矗锛?
- 杈撳叆涓嶆槸鈥滆嚜鐢辫淇兂璞♀€濓紝鑰屾槸锛?  - 鍘熷浘
  - 褰撳墠閫変腑鏂规鐨勮鍔ㄦ枃鏈?  - Memory01 / 闂嵎 / 闀挎湡璁板繂
- 杈撳嚭 XML-like image edit prompt銆?
鍏抽敭绾︽潫锛?
- 淇濈暀鍘熺┖闂寸粨鏋勶細澧欎綋銆佺獥銆侀棬銆佸ぉ鑺便€佸湴鏉裤€佽瑙掋€佹瘮渚嬨€?- 鍙兘鍙鍖栨柟妗堟敮鎸佺殑鏀瑰彉銆?- 瀵逛綆鎴愭湰鍜岃繘闃舵柟妗堬紝閫夋嫨涓€涓槑纭絾鍚堢悊鐨勯鏍兼柟鍚戯紝渚嬪 Bauhaus銆丮emphis銆佹柊涓紡銆佸伐涓氶銆佸ザ娌归銆佺豢妞?biophilic銆?- 鐢熸垚鍥惧繀椤诲儚鍚屼竴涓┖闂磋鏀归€犲悗锛岃€屼笉鏄崲浜嗕竴涓牱鏉块棿銆?
### P005锛氱嫭绔嬪浘鐢熷浘娴嬭瘯 Prompt

鑱岃矗锛?
- 鐢ㄤ簬 `tests/api/test_generation.py` 杩欑被鐙珛娴嬭瘯銆?- 褰撳墠鏄?Bauhaus 椋庢牸 image edit prompt銆?- 涓嶇洿鎺ュ弬涓庝富閾捐矾锛屼絾鍙綔涓?P004 鐨勯鏍煎弬鑰冦€?
---

## 11. 鍓嶇鏋舵瀯

### 椤甸潰缁撴瀯

```text
frontend/src/pages/
  index/GrowPage.tsx
  upload/UploadPage.tsx
  generating/GeneratingPage.tsx
  chat/ChatPage.tsx
  result/ResultPage.tsx
  next/NextPage.tsx
  share/SharePage.tsx
  letter/LetterPage.tsx
  me/MePage.tsx
```

### 缁勪欢缁撴瀯

```text
frontend/src/components/
  BilingualTitle.tsx
  CustomTabBar.tsx
  ImageLightbox.tsx
  NobiMascot.tsx
  NobiWorking.tsx
  PlaceholderImage.tsx
```

### Store

```text
frontend/src/stores/
  space-store
  intervention-store
  memory-store
  user-store
```

### API Client

鏂囦欢锛歚frontend/src/lib/api.ts`

涓昏 API锛?
- `listSessions`
- `getSession`
- `generateIntervention`
- `generateImages`
- `generateLetter`
- `publishFeed`
- `getLongTermMemory`

### 褰撳墠鍓嶇鍘熷垯

- 绉诲姩浼樺厛锛屼絾 PC 鎵撳紑鏃跺憟鐜颁负鎵嬫満 Web App device frame锛屼笉鏄畝鍗曞叏灞忔斁澶с€?- 搴曢儴 Tab 甯搁┗锛岄伩鍏嶅鑸爮涓€浼氬嚭鐜颁竴浼氭秷澶便€?- 椤甸潰闂磋浆鍦哄簲淇濇寔瑙嗚閿氱偣锛屽挨鍏?Grow 鈫?Upload銆?- 鍥剧墖鏀寔鐐瑰嚮鏀惧ぇ锛屼笉寮鸿瑁佸垏鐪熷疄鏁版嵁锛屽彧鍦ㄥ崱鐗囧唴 object-fit cover銆?- 鍏抽敭绛夊緟椤典娇鐢?Nobi frame 鍔ㄧ敾闄嶄綆鐒﹁檻銆?
---

## 12. UI 璁捐鏂瑰悜

褰撳墠 UI 鏂瑰悜鏄?Apple-like + soft futuristic + warm companion銆?
### 瑙嗚鍏抽敭璇?
- 杞?- 娓呴€?- 纾ㄧ爞
- 瀹夐潤
- 鏈潵鎰?- 娓╂煍浣嗕笉骞肩
- 绮捐嚧浣嗕笉钀ラ攢椤?
### 宸插疄鐜扮殑 UI 鐗瑰緛

- 鎵嬫満 Web App 瀹瑰櫒銆?- 搴曢儴 TabBar銆?- Grow Feed 鍗＄墖纾佸惛銆?- 褰撳墠鍗＄墖娓呮櫚锛屼笂涓嬪崱鐗囪交寰ā绯娿€?- 鍗＄墖杩涘叆鏃朵粠妯＄硦鍒版竻鏅般€?- 涓婁紶鍗＄墖涓?Upload 椤靛叡浜瑙夎瑷€銆?- Result 鍥惧儚鏀寔妯悜婊戝姩 before / after銆?- 鐢熸垚鏁堟灉鍥炬椂鍥剧墖鍖哄煙鍔犵（鐮傞伄缃?+ Nobi working 鍔ㄧ敾銆?- 鍥剧墖寮圭獥缁熶竴 `ImageLightbox`銆?
### 闇€瑕佺户缁墦纾?
- 鎵€鏈夐〉闈㈢户缁悜 Grow 鐨勭幓鐠冨崱鐗囦笌纾佸惛鍔ㄦ晥鐪嬮綈銆?- 閬垮厤鎸夐挳銆佹爣棰樸€佸簳閮?fixed bar 鍦ㄤ笉鍚岄〉闈㈠嚭鐜颁綅缃烦鍔ㄣ€?- 鍑忓皯鈥滆鏄庢€ф枃瀛椻€濓紝璁╁姛鑳借嚜鐒跺彲鐞嗚В銆?- 淇濇寔 Nobi 鐨勪镜鍏ユ劅浣庯紝鍑虹幇浣嶇疆瑕佸儚鈥滈櫔鐫€浣犫€濓紝涓嶆槸鎸′綇浣犮€?
---

## 13. Nobi 璁捐

Nobi 鏄?NestAI 鐨勬儏缁鑹诧紝涓嶅彧鏄?mascot銆?
### 瑙掕壊瀹氫綅

- Nobi 鏄┖闂撮噷鐨勫皬闄即鑰呫€?- 瀹冧笉璐熻矗瑙ｉ噴澶嶆潅鍔熻兘锛岃€岃礋璐ｉ檷浣庣瓑寰呫€佷笂浼犮€佸弽棣堟椂鐨勭揣寮犳劅銆?- 瀹冨簲璇ュ儚鈥滆交杞昏共鍦ㄩ偅閲屸€濓紝涓嶆槸寮鸿揩鐢ㄦ埛娉ㄦ剰瀹冦€?
### 褰撳墠绱犳潗璺緞

```text
frontend/public/nobi/
  home-frames/
  questionnaire-frames/
  result-frames/
  effect-frames/
  working-frames/

resources/
  Nobi.png
  head.png
  body.png
  Tail.png
  Working.png
  Waiting.png
```

### 褰撳墠浣跨敤鏂瑰紡

- Grow / Upload 涓婁紶鍗＄墖锛歚NobiMascot`锛岀敱 head/body/tail 鍒嗗眰鎴?frame 绱犳潗椹卞姩銆?- 闂嵎鍔犺浇椤碉細`NobiWorking variant="questionnaire"`銆?- Result 鍔犺浇椤碉細`NobiWorking variant="result"`銆?- 鐢熸垚鏁堟灉鍥鹃伄缃╋細`NobiWorking variant="effect"`銆?
### Nobi 鍔ㄦ晥鍘熷垯

- 灏忓箙搴︺€?- 鎱竴鐐广€?- 涓嶉闂€?- 涓嶆尅浣忎富瑕佸唴瀹广€?- 宸ヤ綔鐘舵€佸彲浠ョ敤 8-frame PNG 寰幆銆?- 棣栭〉濡傛灉浣跨敤鍒嗗抚锛岃淇濊瘉甯ч棿鍙樺寲瓒冲灏忥紱鍚﹀垯 CSS 灞€閮ㄦ憜鍔ㄤ細鏇撮『婊戙€?
---

## 14. 褰撳墠鏈€閲嶈鐨勪笅涓€姝?
### P0锛氱ǔ瀹氫富閾捐矾

- 鐢ㄤ竴缁勭湡瀹炲浘鐗囧畬鏁磋窇锛?  - Upload
  - P001
  - Chat
  - P002
  - Result
  - P004
  - Image generation
  - Next
  - Share
  - Letter
  - Feed publish
  - LongTermMemory update

### P1锛歋chema 涓庨敊璇仮澶?
- 涓?P001/P002/P003/P004 寤虹珛涓ユ牸 JSON Schema銆?- 鎵€鏈?LLM 杈撳嚭鍏?parse + validate銆?- 澶辫触鏃惰嚜鍔?retry 鎴?fallback銆?- 鍓嶇閿欒淇℃伅瑕佸叿浣擄紝姣斿鈥滃浘鐗囩悊瑙ｅけ璐モ€濃€滅敓鎴愬浘澶辫触鈥濃€滀繚瀛樺弽棣堝け璐モ€濄€?
### P2锛歁emory 浜у搧鍖?
- Me 椤靛睍绀?`LongTermMemory.md`銆?- 鐢ㄦ埛鍙互缂栬緫/鍒犻櫎闀挎湡璁板繂銆?- 姣忔 prompt 娉ㄥ叆鍙娇鐢?compact memory锛屼笉鐩存帴濉炲畬鏁?markdown銆?- MemoryCuratorAgent 闇€瑕佹洿寮猴細鎻愬彇瀹＄編銆侀绠椼€佽鍔ㄤ範鎯€佺┖闂撮檺鍒躲€?
### P3锛欶eed / Next 浜у搧鍖?
- Feed 鍖哄垎锛?  - seed posts
  - 鐢ㄦ埛鍙戝竷 posts
  - 鑷繁鐨勫巻鍙插彉鍖?- Next 鍖哄垎锛?  - 鏈畬鎴?  - 宸插畬鎴?  - 宸插弽棣?- 鍙戝竷鍒?Grow 鍓嶅鍔犵敤鎴风‘璁ゃ€?
### P4锛氶儴缃蹭笌澶氱敤鎴?
- 鏈湴缁х画 SQLite + local uploads銆?- Demo/鐢熶骇鍐嶅惎鐢細
  - Vercel
  - Render
  - Supabase Postgres
  - Supabase Storage
- 澧炲姞鐢ㄦ埛韬唤銆佹暟鎹殧绂汇€佹潈闄愭帶鍒躲€?
---

## 15. 缁欏悗缁?Agent 鐨勫紑鍙戞敞鎰忎簨椤?
- 涓嶈鎶?`Memory01` 鍘熸枃鐩存帴灞曠ず鍦ㄥ墠绔€?- 涓嶈鎶?P004 鐞嗚В鎴愨€滅洿鎺ヨ鍥剧墖妯″瀷鑷敱鍙戞尌鈥濓紱P004 鏄€滆鍔ㄦ枃鏈?-> 鍥剧敓鍥?prompt鈥濈殑缈昏瘧鍣ㄣ€?- 涓嶈鎶?Grow Feed 鍋氬洖 mock锛汧eed 宸叉湁 `feed_posts` 鏁版嵁琛ㄣ€?- 涓嶈璁?Upload 杩斿洖 Grow 鐩存帴 `navigate(-1)` 闂洖锛涜淇濇寔鍙屽悜杞満涓€鑷淬€?- 涓嶈鍦ㄥ墠绔‖缂栫爜闂嵎锛涢棶鍗峰繀椤绘潵鑷?P001 鍥剧墖鐞嗚В銆?- 涓嶈缁曡繃 `llm_manager` 鐩存帴鏁ｈ惤璋冪敤妯″瀷锛岄櫎闈炴槸鐙珛娴嬭瘯鏂囦欢銆?- 涓嶈鎶婂畬鏁撮暱鏈?Memory 涓€鑲¤剳濉炵粰妯″瀷锛屼娇鐢?compact memory銆?- 涓嶈鎶?Nobi 鍋氬緱澶ぇ銆佸お蹇€佸お鎶㈡垙銆?- 姣忔鍓嶇鏀瑰姩鍚庤嚦灏戣繍琛岋細

```bash
pnpm --dir frontend build
```

姣忔鍚庣 Python 鏀瑰姩鍚庤嚦灏戣繍琛岋細

```bash
python -m py_compile <changed_file.py>
```


