#!/bin/sh
set -e

echo "Applying database migrations..."
node /opt/prisma/node_modules/prisma/build/index.js migrate deploy --schema prisma/schema.prisma

echo "Seeding test users and sample documents..."
node prisma/dist/seed.js

echo "Starting Ajaia Docs on port ${PORT:-3000}"
exec node server.js
