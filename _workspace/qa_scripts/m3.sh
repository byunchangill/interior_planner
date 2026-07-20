#!/usr/bin/env bash
# M3 (RECO) 통합 QA 재현 스크립트. 사용자·공간 시드 → 비동기 분석 → 폴링 → 상세/시각화.
# 주의: 한글은 UTF-8 파일 페이로드(--data-binary @file)로 전송(콘솔 코드페이지 깨짐 방지).
set -e
BASE=${1:-http://localhost:8080/api/v1}
J="Content-Type: application/json; charset=utf-8"
TMP=$(mktemp -d)

login() { # email pw -> echoes accessToken
  local email=$1 pw=$2
  printf '{"email":"%s","password":"%s"}' "$email" "$pw" > "$TMP/l.json"
  curl -s -X POST $BASE/auth/login -H "$J" --data-binary @"$TMP/l.json" \
    | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p'
}
signup() { # email nickname
  printf '{"email":"%s","password":"Passw0rd!","nickname":"%s","consents":{"termsOfService":true,"privacyPolicy":true,"imageProcessing":true,"marketing":false}}' "$1" "$2" > "$TMP/s.json"
  curl -s -X POST $BASE/auth/signup -H "$J" --data-binary @"$TMP/s.json" >/dev/null || true
}

# 유효 JPEG 생성 (photo 업로드용 — ImageIO 로 디코딩 가능해야 함)
PJPG_WIN=$(cygpath -w "$TMP/p.jpg" 2>/dev/null || echo "$TMP/p.jpg")
python -c "from PIL import Image; Image.new('RGB',(64,48),(180,160,140)).save(r'$PJPG_WIN','JPEG')"

echo "=== seed user A ==="
signup "reco-a@example.com" "유저A"
AT=$(login "reco-a@example.com" "Passw0rd!")
echo "tokenA len: ${#AT}"

echo "=== create space (LIVING) ==="
printf '{"spaceType":"LIVING_ROOM","name":"우리집 거실"}' > "$TMP/sp.json"
SP=$(curl -s -X POST $BASE/spaces -H "$J" -H "Authorization: Bearer $AT" --data-binary @"$TMP/sp.json")
echo "$SP"
SID=$(echo "$SP" | sed -n 's/.*"spaceId":\([0-9]*\).*/\1/p')

echo "=== upload photo ==="
curl -s -X POST $BASE/spaces/$SID/photos -H "Authorization: Bearer $AT" -F "file=@$PJPG_WIN;type=image/jpeg" -F "isFloorPlan=false" | head -c 250; echo

echo "=== set dimensions (4.0 x 3.2 x 2.4) ==="
printf '{"widthM":4.0,"depthM":3.2,"heightM":2.4,"isUserVerified":true,"openings":[]}' > "$TMP/dim.json"
curl -s -X PATCH $BASE/spaces/$SID/dimensions -H "$J" -H "Authorization: Bearer $AT" --data-binary @"$TMP/dim.json" | head -c 200; echo

echo "=== POST /analyses (hasPets=true, WFH=true, STORAGE+OWNED) ==="
printf '{"spaceId":%s,"styles":["NORDIC","WOOD"],"budgetRange":"R300_500","preferredColors":["#F5F0E8","#8B7355"],"requiredFurniture":["SOFA"],"lifestyle":{"householdSize":2,"hasChildren":false,"hasPets":true,"worksFromHome":true,"cooksOften":false,"storagePreference":"STORAGE","housingType":"OWNED","residenceYears":2}}' "$SID" > "$TMP/an.json"
AN=$(curl -s -w "\n[%{http_code}]" -X POST $BASE/analyses -H "$J" -H "Authorization: Bearer $AT" --data-binary @"$TMP/an.json")
echo "$AN"
AID=$(echo "$AN" | sed -n 's/.*"analysisId":\([0-9]*\).*/\1/p')

echo "=== poll until terminal ==="
for i in $(seq 1 20); do
  P=$(curl -s $BASE/analyses/$AID -H "Authorization: Bearer $AT")
  ST=$(echo "$P" | sed -n 's/.*"status":"\([^"]*\)".*/\1/p')
  echo "poll $i: $P"
  case "$ST" in COMPLETED|FAILED) break;; esac
  sleep 2
done

RIDS=$(echo "$P" | sed -n 's/.*"recommendationIds":\[\([0-9,]*\)\].*/\1/p')
RID1=$(echo "$RIDS" | cut -d, -f1)
echo "recommendationIds: $RIDS   first: $RID1"

echo "=== GET /recommendations/$RID1 (detail) ==="
curl -s $BASE/recommendations/$RID1 -H "Authorization: Bearer $AT"; echo

echo "=== GET /recommendations/$RID1/visuals ==="
curl -s $BASE/recommendations/$RID1/visuals -H "Authorization: Bearer $AT"; echo

echo "=== POST regenerate (202 stub) ==="
curl -s -w " [%{http_code}]\n" -X POST $BASE/recommendations/$RID1/visuals/regenerate -H "Authorization: Bearer $AT"

echo "$AT|$SID|$AID|$RID1" > "$TMP/../m3_ctx.txt" 2>/dev/null || true
echo "CTX: AT_len=${#AT} SID=$SID AID=$AID RID1=$RID1"
echo "TMPDIR=$TMP"
