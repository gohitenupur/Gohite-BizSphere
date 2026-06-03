FROM node:20-alpine AS base
WORKDIR /app
COPY package.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN npm install --workspace=shared --workspace=backend

COPY shared ./shared
COPY backend ./backend
RUN npm run db:generate -w backend

WORKDIR /app/backend
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node server.js"]
