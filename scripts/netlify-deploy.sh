#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export NETLIFY_AUTH_TOKEN="$(
  python3 -c "import json,os; c=json.load(open(os.path.expanduser('~/Library/Preferences/netlify/config.json'))); print(c['users'][c['userId']]['auth']['token'])"
)"

npm install --no-audit --no-fund

SITE_NAME="${NETLIFY_SITE_NAME:-exam-trainer}"
SITE_ID="$(
  npx --yes netlify sites:list --json 2>/dev/null | python3 -c "
import json,sys
name = '$SITE_NAME'
for s in json.load(sys.stdin):
    if s.get('name') == name:
        print(s['id'])
        break
" || true
)"

if [ -z "$SITE_ID" ]; then
  echo "Creating Netlify site: $SITE_NAME"
  DEPLOY_JSON="$(npx --yes netlify deploy --prod --create-site "$SITE_NAME" --json)"
else
  echo "Deploying to existing site: $SITE_NAME ($SITE_ID)"
  DEPLOY_JSON="$(npx --yes netlify deploy --prod --site "$SITE_ID" --json)"
fi

PROD_URL="$(python3 -c "import json,sys; d=json.load(sys.stdin); print((d.get('url') or d.get('deploy_ssl_url') or '').rstrip('/') + '/')" <<<"$DEPLOY_JSON")"
echo "Production URL: $PROD_URL"
echo "$PROD_URL" > .netlify-production-url.txt

echo "Verify homepage:"
curl -fsSL "${PROD_URL}" | head -c 200
echo ""
echo "Verify sync:"
curl -sS -o /dev/null -w "HTTP %{http_code}\n" "${PROD_URL}.netlify/functions/sync?key=demo-test-key"
