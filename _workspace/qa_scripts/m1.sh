#!/usr/bin/env bash
# M1 (AUTH+HOME) 통합 QA 재현 스크립트. BASE 포트만 바꿔 재사용.
# 주의: 한글 nickname은 반드시 UTF-8 파일 페이로드(--data-binary @file)로 전송할 것.
#       curl -d 인라인 + Windows 콘솔 코드페이지 조합은 nickname을 깨뜨려 500을 유발한다(FE axios와 무관한 콘솔 아티팩트).
set -e
BASE=${1:-http://localhost:8080/api/v1}
J="Content-Type: application/json; charset=utf-8"
TMP=$(mktemp -d)

printf '%s' '{"email":"qa@example.com","password":"Passw0rd!","nickname":"홍길동","consents":{"termsOfService":true,"privacyPolicy":true,"imageProcessing":true,"marketing":false}}' > "$TMP/signup.json"

echo "# signup"; curl -s -X POST $BASE/auth/signup -H "$J" --data-binary @"$TMP/signup.json"; echo
echo "# signup missing consent -> AUTH_004";
printf '%s' '{"email":"c@example.com","password":"Passw0rd!","nickname":"NC","consents":{"termsOfService":true,"privacyPolicy":false,"imageProcessing":true,"marketing":false}}' > "$TMP/nc.json"
curl -s -X POST $BASE/auth/signup -H "$J" --data-binary @"$TMP/nc.json"; echo

LOGIN=$(curl -s -X POST $BASE/auth/login -H "$J" --data-binary '{"email":"qa@example.com","password":"Passw0rd!"}')
echo "# login"; echo "$LOGIN"; echo
AT=$(echo "$LOGIN" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
RT=$(echo "$LOGIN" | sed -n 's/.*"refreshToken":"\([^"]*\)".*/\1/p')

echo "# me (auth)"; curl -s $BASE/auth/me -H "Authorization: Bearer $AT"; echo
echo "# home/summary (auth)"; curl -s $BASE/home/summary -H "Authorization: Bearer $AT"; echo
echo "# home/summary no token -> 401 COMMON_401"; curl -s -w " [%{http_code}]\n" $BASE/home/summary
echo "# styles (public)"; curl -s $BASE/styles | head -c 100; echo
echo "# styles/NORDIC"; curl -s $BASE/styles/NORDIC | head -c 100; echo
echo "# styles/BOGUS -> 404 RES_001"; curl -s -w " [%{http_code}]\n" $BASE/styles/BOGUS
echo "# refresh rotation"; printf '{"refreshToken":"%s"}' "$RT" > "$TMP/rt.json"
curl -s -X POST $BASE/auth/refresh -H "$J" --data-binary @"$TMP/rt.json"; echo
echo "# old refresh reuse -> 401 AUTH_002"; curl -s -w " [%{http_code}]\n" -X POST $BASE/auth/refresh -H "$J" --data-binary @"$TMP/rt.json"
echo "# SECURITY: refreshToken as accessToken -> must be 401 (fixed)"; curl -s -w " [%{http_code}]\n" $BASE/auth/me -H "Authorization: Bearer $RT"
rm -rf "$TMP"
