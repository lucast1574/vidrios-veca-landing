FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/panel/package.json apps/panel/package.json
COPY apps/site/package.json apps/site/package.json
COPY packages/content/package.json packages/content/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN npm ci
COPY apps ./apps
COPY packages ./packages
COPY scripts ./scripts
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm prune --omit=dev --ignore-scripts && rm -rf apps/site/.next/cache apps/site/.next/standalone
FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 APP_ROLE=site
COPY --from=build /app /app
USER node
EXPOSE 80 3000 4000
CMD ["node","scripts/start.mjs"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 CMD node -e "const p=process.env.PORT||(process.env.APP_ROLE==='api'?4000:process.env.APP_ROLE==='panel'?3000:80);fetch('http://127.0.0.1:'+p+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
