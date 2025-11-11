# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Kopier package.json og package-lock.json
COPY package*.json ./

# Installer dependencies
RUN npm install

# Kopier resten av koden
COPY . .

# Bygg React-appen
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Installer en enkel HTTP-server for å serve den byggede appen
RUN npm install -g serve

# Kopier bygget fra builder-stagen
COPY --from=builder /app/build ./build

# Eksponert port
EXPOSE 5173

# Start kommando
CMD ["serve", "-s", "build", "-l", "5173"]
