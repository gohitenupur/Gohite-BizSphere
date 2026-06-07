FROM node:20-alpine AS base
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN npm install

COPY shared ./shared
COPY backend ./backend
COPY frontend ./frontend
RUN npm run db:generate -w backend
RUN npm run build -w frontend

WORKDIR /app/backend
EXPOSE 3001
CMD ["sh", "-c", "NODE_ENV=production npx prisma migrate deploy && NODE_ENV=production node server.js"]
