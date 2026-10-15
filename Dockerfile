# ==============================================================================
# Google Cloud Run Container Specification for ECO AI Bootcamp Backend
# ==============================================================================
FROM node:22-alpine AS production

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies only (with fallback)
RUN npm ci --omit=dev || npm install --omit=dev

# Copy server entrypoint and backend server implementation
COPY server.js ./
COPY src/server ./src/server

# Security: Run as unprivileged node user
USER node

# Google Cloud Run default port
EXPOSE 8080

# Start production server
CMD ["node", "--experimental-strip-types", "server.js"]
