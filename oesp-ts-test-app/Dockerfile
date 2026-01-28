# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Copy the entire monorepo structure needed for local dependencies
# We copy everything to ensure all workspace references are valid
COPY oesp-ts /app/oesp-ts
COPY oesp-ts-test-app /app/oesp-ts-test-app

# Build oesp-ts packages first
WORKDIR /app/oesp-ts
# Install dependencies including workspace links
RUN npm install
# Build required packages in the workspace (skipping keystore-node if it fails)
RUN npm run build --workspace=@oesp/sdk --workspace=@oesp/crypto-sodium --workspace=@oesp/storage-memory --workspace=@oesp/sync-http --workspace=@oesp/transport-ble-gatt

# Build the test app
WORKDIR /app/oesp-ts-test-app

ARG VITE_OESP_SYNC_BASE_URL
ENV VITE_OESP_SYNC_BASE_URL=$VITE_OESP_SYNC_BASE_URL

# Install dependencies (will link to the built local packages)
RUN npm install
# Build the Vite app
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Copy the built assets from the builder stage
COPY --from=builder /app/oesp-ts-test-app/dist /usr/share/nginx/html

# Configure Nginx for SPA (Single Page Application)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
