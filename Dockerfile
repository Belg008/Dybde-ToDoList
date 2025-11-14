# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
# COPY --from=builder /app/build ./build
EXPOSE 5173
CMD ["serve", "-s", "build", "-l", "5173"]
