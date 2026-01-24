#!/usr/bin/env sh
set -e

docker compose -f docker-compose.dev.yml up -d --build
