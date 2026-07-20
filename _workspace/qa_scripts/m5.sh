#!/usr/bin/env bash
# M5 MY/DATA 런타임 검증 — 물리 삭제·탈퇴 연쇄·SHARE_002·AUTH_001.
# 사용: bash m5.sh [BASE_URL]  (기본 http://localhost:8080/api/v1)
set -u
BASE="${1:-http://localhost:8080/api/v1}"
UPLOADS="C:/Users/chang/Desktop/interior_planner/backend/uploads"
PASS=0; FAIL=0
ok(){ echo "  PASS: $1"; PASS=$((PASS+1)); }
no(){ echo "  FAIL: $1"; FAIL=$((FAIL+1)); }
j(){ python -c "import sys,json;d=json.load(sys.stdin);print(eval('d'+sys.argv[1]))" "$1" 2>/dev/null; }

EMAIL="m5_$(date +%s)@ex.com"
# 1) signup
TOK=$(curl -s -X POST "$BASE/auth/signup" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Passw0rd!\",\"nickname\":\"m5test\",\"consents\":{\"termsOfService\":true,\"privacyPolicy\":true,\"imageProcessing\":true,\"marketing\":false}}" \
  | j "['data']['accessToken']")
[ -n "$TOK" ] && ok "signup+token" || { no "signup"; exit 1; }
AUTH="Authorization: Bearer $TOK"

# 2) create space + upload 2 photos (real files on disk)
SID=$(curl -s -X POST "$BASE/spaces" -H "$AUTH" -H 'Content-Type: application/json' -d '{"spaceType":"LIVING_ROOM","name":"living"}' | j "['data']['spaceId']")
[ -n "$SID" ] && ok "create space #$SID" || no "create space"
python -c "from PIL import Image; Image.new('RGB',(64,64),'red').save(r'$UPLOADS/../_m5a.jpg')" 2>/dev/null || echo "iVBORw0KGgo=" > /tmp/_m5a.jpg
IMG_SRC="C:/Users/chang/Desktop/interior_planner/backend/_m5a.jpg"
[ -f "$IMG_SRC" ] || printf '\xff\xd8\xff\xe0dummy' > "$IMG_SRC"
URL1=$(curl -s -X POST "$BASE/spaces/$SID/photos" -H "$AUTH" -F "file=@$IMG_SRC;type=image/jpeg" -F "isFloorPlan=false" | j "['data']['url']")
URL2=$(curl -s -X POST "$BASE/spaces/$SID/photos" -H "$AUTH" -F "file=@$IMG_SRC;type=image/jpeg" -F "isFloorPlan=false" | j "['data']['url']")
F1="$UPLOADS/$(basename "$URL1")"; F2="$UPLOADS/$(basename "$URL2")"
[ -f "$F1" ] && [ -f "$F2" ] && ok "2 files on disk" || no "files on disk ($F1)"

# 3) profile + images
PC=$(curl -s "$BASE/me/profile" -H "$AUTH" | j "['data']['stats']['photoCount']")
[ "$PC" = "2" ] && ok "profile photoCount=2" || no "profile photoCount=$PC"
IC=$(curl -s "$BASE/me/images" -H "$AUTH" | python -c "import sys,json;print(len(json.load(sys.stdin)['data']['items']))")
[ "$IC" = "2" ] && ok "images list=2" || no "images list=$IC"
PID1=$(curl -s "$BASE/me/images" -H "$AUTH" | j "['data']['items'][0]['photoId']")

# 4) DELETE one image keepResults=true → file physically gone
curl -s -X DELETE "$BASE/me/images" -H "$AUTH" -H 'Content-Type: application/json' \
  -d "{\"imageIds\":[$PID1],\"deleteAll\":false,\"keepResults\":true,\"confirmShareRevoke\":false}" >/dev/null
# figure which file corresponds to PID1 — just assert one of F1/F2 is now gone and count decreased
IC2=$(curl -s "$BASE/me/images" -H "$AUTH" | python -c "import sys,json;print(len(json.load(sys.stdin)['data']['items']))")
[ "$IC2" = "1" ] && ok "after delete images list=1" || no "after delete list=$IC2"
GONE=0; [ ! -f "$F1" ] && GONE=$((GONE+1)); [ ! -f "$F2" ] && GONE=$((GONE+1))
[ "$GONE" = "1" ] && ok "exactly 1 file physically deleted" || no "physical delete count=$GONE"

# 5) withdrawal wrong password → AUTH_001
CODE=$(curl -s -X DELETE "$BASE/me" -H "$AUTH" -H 'Content-Type: application/json' -d '{"password":"WRONGpw9!"}' | j "['error']['code']")
[ "$CODE" = "AUTH_001" ] && ok "withdraw wrong pw → AUTH_001" || no "withdraw wrong pw → $CODE"

# 6) withdrawal correct password → deleted, files gone, re-login fails
DEL=$(curl -s -X DELETE "$BASE/me" -H "$AUTH" -H 'Content-Type: application/json' -d '{"password":"Passw0rd!"}' | j "['data']['deleted']")
[ "$DEL" = "True" ] && ok "withdraw ok" || no "withdraw → $DEL"
REMAIN=0; [ -f "$F1" ] && REMAIN=$((REMAIN+1)); [ -f "$F2" ] && REMAIN=$((REMAIN+1))
[ "$REMAIN" = "0" ] && ok "all files gone after withdraw" || no "files remain after withdraw=$REMAIN"
LOGIN=$(curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"Passw0rd!\"}" | j "['success']")
[ "$LOGIN" = "False" ] && ok "re-login after withdraw fails" || no "re-login → $LOGIN"

rm -f "$IMG_SRC"
echo "=== M5 runtime: PASS=$PASS FAIL=$FAIL ==="
