#!/usr/bin/env bash
# M4 (SAVE) 통합 QA 재현 스크립트. 저장·대표·비교·공유링크·공개뷰(비인증)·410·구매목록·접근제어.
# 한글은 UTF-8 파일 페이로드로 전송(콘솔 코드페이지 깨짐 방지).
BASE=${1:-http://localhost:8080/api/v1}
J="Content-Type: application/json; charset=utf-8"
TMP=$(mktemp -d)

login() { local email=$1 pw=$2
  printf '{"email":"%s","password":"%s"}' "$email" "$pw" > "$TMP/l.json"
  curl -s -X POST $BASE/auth/login -H "$J" --data-binary @"$TMP/l.json" \
    | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p'; }
signup() {
  printf '{"email":"%s","password":"Passw0rd!","nickname":"%s","consents":{"termsOfService":true,"privacyPolicy":true,"imageProcessing":true,"marketing":false}}' "$1" "$2" > "$TMP/s.json"
  curl -s -X POST $BASE/auth/signup -H "$J" --data-binary @"$TMP/s.json" >/dev/null || true; }

PJPG_WIN=$(cygpath -w "$TMP/p.jpg" 2>/dev/null || echo "$TMP/p.jpg")
python -c "from PIL import Image; Image.new('RGB',(64,48),(180,160,140)).save(r'$PJPG_WIN','JPEG')"

# 한 공간에 대해 분석 실행 → recommendationIds 반환
make_space_and_recs() { # token name width -> echoes "SID:RID1,RID2,..."
  local AT=$1 name=$2 w=$3
  printf '{"spaceType":"LIVING_ROOM","name":"%s"}' "$name" > "$TMP/sp.json"
  local SP=$(curl -s -X POST $BASE/spaces -H "$J" -H "Authorization: Bearer $AT" --data-binary @"$TMP/sp.json")
  local SID=$(echo "$SP" | sed -n 's/.*"spaceId":\([0-9]*\).*/\1/p')
  curl -s -X POST $BASE/spaces/$SID/photos -H "Authorization: Bearer $AT" -F "file=@$PJPG_WIN;type=image/jpeg" -F "isFloorPlan=false" >/dev/null
  printf '{"widthM":%s,"depthM":3.2,"heightM":2.4,"isUserVerified":true,"openings":[]}' "$w" > "$TMP/dim.json"
  curl -s -X PATCH $BASE/spaces/$SID/dimensions -H "$J" -H "Authorization: Bearer $AT" --data-binary @"$TMP/dim.json" >/dev/null
  printf '{"spaceId":%s,"styles":["NORDIC","WOOD"],"budgetRange":"R300_500","preferredColors":["#F5F0E8"],"requiredFurniture":["SOFA"],"lifestyle":{"householdSize":2,"hasChildren":false,"hasPets":true,"worksFromHome":true,"cooksOften":false,"storagePreference":"STORAGE","housingType":"OWNED","residenceYears":2}}' "$SID" > "$TMP/an.json"
  local AN=$(curl -s -X POST $BASE/analyses -H "$J" -H "Authorization: Bearer $AT" --data-binary @"$TMP/an.json")
  local AID=$(echo "$AN" | sed -n 's/.*"analysisId":\([0-9]*\).*/\1/p')
  local P RIDS
  for i in $(seq 1 20); do
    P=$(curl -s $BASE/analyses/$AID -H "Authorization: Bearer $AT")
    local ST=$(echo "$P" | sed -n 's/.*"status":"\([^"]*\)".*/\1/p')
    case "$ST" in COMPLETED|FAILED) break;; esac; sleep 2
  done
  RIDS=$(echo "$P" | sed -n 's/.*"recommendationIds":\[\([0-9,]*\)\].*/\1/p')
  echo "$SID:$RIDS"
}

echo "=== seed user A / B ==="
signup "m4-a@example.com" "유저A"; signup "m4-b@example.com" "유저B"
ATA=$(login "m4-a@example.com" "Passw0rd!")
ATB=$(login "m4-b@example.com" "Passw0rd!")
echo "tokenA len ${#ATA}, tokenB len ${#ATB}"

echo "=== A: space1 (2 recs same space) ==="
R1=$(make_space_and_recs "$ATA" "거실1" 4.0); echo "space1 -> $R1"
SID1=${R1%%:*}; RIDS1=${R1#*:}; RID_A=$(echo "$RIDS1"|cut -d, -f1); RID_B=$(echo "$RIDS1"|cut -d, -f2)
echo "=== A: space2 (different space) ==="
R2=$(make_space_and_recs "$ATA" "거실2" 5.0); echo "space2 -> $R2"
RIDS2=${R2#*:}; RID_C=$(echo "$RIDS2"|cut -d, -f1)
echo "=== B: own rec (for AUTH_003) ==="
RB=$(make_space_and_recs "$ATB" "B거실" 4.0); RID_OTHER=$(echo "${RB#*:}"|cut -d, -f1)
echo "RID_A=$RID_A RID_B=$RID_B (space1)  RID_C=$RID_C (space2)  RID_OTHER=$RID_OTHER (userB)"

hr(){ echo "--------------------------------------------------------"; }
GET(){  curl -s -w "\n[%{http_code}]\n" "$1" -H "Authorization: Bearer $2"; }
POSTn(){ curl -s -w "\n[%{http_code}]\n" -X POST "$1" -H "Authorization: Bearer $2"; }
PUTn(){ curl -s -w "\n[%{http_code}]\n" -X PUT "$1" -H "Authorization: Bearer $2"; }
DELn(){ curl -s -w "\n[%{http_code}]\n" -X DELETE "$1" -H "Authorization: Bearer $2"; }

hr; echo "SAVE-001  POST save RID_A, RID_B, RID_C"
POSTn "$BASE/recommendations/$RID_A/save" "$ATA"
POSTn "$BASE/recommendations/$RID_B/save" "$ATA"
POSTn "$BASE/recommendations/$RID_C/save" "$ATA"
hr; echo "GET /saved (expect 3 items, savedAt desc)"
GET "$BASE/saved" "$ATA"
hr; echo "PUT select RID_A then RID_B (same space -> RID_A auto-unselect)"
PUTn "$BASE/recommendations/$RID_A/select" "$ATA"
PUTn "$BASE/recommendations/$RID_B/select" "$ATA"
echo ">> /saved after select (RID_A selected=false, RID_B selected=true expected):"
GET "$BASE/saved" "$ATA"

hr; echo "SAVE-002 compare — 1개(VALID_003)"
curl -s -w "\n[%{http_code}]\n" -X POST $BASE/recommendations/compare -H "$J" -H "Authorization: Bearer $ATA" --data-binary "{\"recommendationIds\":[$RID_A],\"compareKey\":\"STYLE\"}"
echo "compare — same space 2개 (sameSpace:true)"
curl -s -w "\n[%{http_code}]\n" -X POST $BASE/recommendations/compare -H "$J" -H "Authorization: Bearer $ATA" --data-binary "{\"recommendationIds\":[$RID_A,$RID_B],\"compareKey\":\"STYLE\"}"
echo "compare — 다른 공간 (200 + sameSpace:false)"
curl -s -w "\n[%{http_code}]\n" -X POST $BASE/recommendations/compare -H "$J" -H "Authorization: Bearer $ATA" --data-binary "{\"recommendationIds\":[$RID_A,$RID_C],\"compareKey\":\"STYLE\"}"
echo "compare — 타인 포함 (AUTH_003)"
curl -s -w "\n[%{http_code}]\n" -X POST $BASE/recommendations/compare -H "$J" -H "Authorization: Bearer $ATA" --data-binary "{\"recommendationIds\":[$RID_A,$RID_OTHER],\"compareKey\":\"STYLE\"}"

hr; echo "SAVE-003 create share link (D30, includeOriginalPhotos:false)"
SL=$(curl -s -X POST $BASE/recommendations/$RID_A/share-links -H "$J" -H "Authorization: Bearer $ATA" --data-binary '{"expiresIn":"D30","includeOriginalPhotos":false}')
echo "$SL"
TOKEN=$(echo "$SL" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
LINKID=$(echo "$SL" | sed -n 's/.*"linkId":\([0-9]*\).*/\1/p')
echo "TOKEN=$TOKEN LINKID=$LINKID"
echo "create share link (NONE -> expiresAt null, includeOriginalPhotos:true)"
SL2=$(curl -s -X POST $BASE/recommendations/$RID_A/share-links -H "$J" -H "Authorization: Bearer $ATA" --data-binary '{"expiresIn":"NONE","includeOriginalPhotos":true}')
echo "$SL2"
TOKEN2=$(echo "$SL2" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
echo "GET share-links list"
GET "$BASE/recommendations/$RID_A/share-links" "$ATA"

hr; echo "공개뷰 — 비인증 GET /share/$TOKEN (NO auth header) expect 200"
curl -s -w "\n[%{http_code}]\n" $BASE/share/$TOKEN
echo ">> purchaseUrl 노출 여부(없어야 함):"; curl -s $BASE/share/$TOKEN | grep -o purchaseUrl || echo "  (purchaseUrl 미노출 OK)"
echo "공개뷰 — includeOriginalPhotos:true 링크 originalPhotos 확인"
curl -s $BASE/share/$TOKEN2 | grep -o '"originalPhotos":\[[^]]*\]'

hr; echo "링크 한도 — RID_A 에 추가 생성해서 5개 초과 시 LIMIT_002 (이미 2개, +4 = 6번째 실패 기대)"
for n in 3 4 5 6; do
  echo -n "link#$n: "; curl -s -w " [%{http_code}]\n" -X POST $BASE/recommendations/$RID_A/share-links -H "$J" -H "Authorization: Bearer $ATA" --data-binary '{"expiresIn":"D7","includeOriginalPhotos":false}' | sed -n 's/.*\(\"code\":\"[^"]*\"\).*\(\[[0-9]*\]\)/\1 \2/p;s/.*\("linkId":[0-9]*\).*\(\[[0-9]*\]\)/\1 \2/p'
done

hr; echo "링크 회수 DELETE /share-links/$LINKID"
DELn "$BASE/share-links/$LINKID" "$ATA"
echo "공개뷰 — 회수된 토큰 재접근 expect 410 SHARE_001"
curl -s -w "\n[%{http_code}]\n" $BASE/share/$TOKEN
echo "공개뷰 — 존재하지 않는 토큰 expect 410 (정보 은닉)"
curl -s -w "\n[%{http_code}]\n" $BASE/share/doesnotexist123456

hr; echo "SAVE-006 shopping-list"
GET "$BASE/recommendations/$RID_A/shopping-list" "$ATA"

hr; echo "접근제어 — 타인(B) 이 A의 저장/select/share-link/shopping-list 접근 expect 403 AUTH_003"
echo -n "B save A's rec: ";  curl -s -w " [%{http_code}]\n" -X POST $BASE/recommendations/$RID_A/save -H "Authorization: Bearer $ATB" | tail -c 120
echo -n "B shopping A's rec: "; curl -s -w " [%{http_code}]\n" $BASE/recommendations/$RID_A/shopping-list -H "Authorization: Bearer $ATB" | tail -c 120

echo "TMPDIR=$TMP"
echo "CTX TOKEN=$TOKEN TOKEN2=$TOKEN2 RID_A=$RID_A"
