FROM oven/bun:latest as build

WORKDIR /app

COPY package.json .
COPY bun.lockb .
COPY prisma/schema.prisma .

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM oven/bun:latest

ENV PORT 3000
EXPOSE 3000

WORKDIR /usr/src/app

COPY --from=build /app .
COPY docker_start.sh .

ENTRYPOINT [ "./docker_start.sh" ]
