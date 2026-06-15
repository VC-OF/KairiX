# Stage 1: Build dependencies and compile native modules
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools needed for native dependencies like bcrypt
RUN apk add --no-cache python3 make g++ gcc

COPY package*.json ./

RUN npm ci --only=production

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Copy production node_modules from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY . .

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "index.js"]

