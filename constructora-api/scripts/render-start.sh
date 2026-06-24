#!/bin/sh
set -eu

sh ./scripts/render-predeploy.sh

exec node dist/main.js
