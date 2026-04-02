#!/bin/sh
bunx prisma migrate deploy --schema prisma/schema.prisma
bun run start
