#!/bin/sh
set -eu

: "${API_BASE_URL:=http://localhost:8000}"
export API_BASE_URL

if [ -f /usr/share/nginx/html/config/runtime.js.template ]; then
  envsubst '${API_BASE_URL}' \
    < /usr/share/nginx/html/config/runtime.js.template \
    > /usr/share/nginx/html/config/runtime.js
fi
