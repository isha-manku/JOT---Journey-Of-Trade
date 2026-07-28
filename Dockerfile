FROM node:20-bullseye AS crm-builder
WORKDIR /app/crm
COPY backend/crm-jot-frontend/package*.json ./
RUN npm install
COPY backend/crm-jot-frontend/ ./
# Use relative URLs for production build so it works from any IP
ENV REACT_APP_API_URL=""
ENV REACT_APP_DOC_AUTO_URL="/docplatform"
RUN npm run build

FROM node:20-bullseye AS doc-builder
WORKDIR /app/doc
COPY docplatform-frontend/package*.json ./
RUN npm install
COPY docplatform-frontend/ ./
ENV VITE_API_URL="/doc-api"
RUN npm run build

FROM node:20-bullseye AS backend
# Install LibreOffice, unoconv, and fonts for accurate PDF rendering
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-script-provider-python \
    unoconv \
    fonts-liberation \
    fonts-dejavu \
    fonts-croscore \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

# Copy compiled frontends into backend's public directory
COPY --from=crm-builder /app/crm/build ./public/crm
COPY --from=doc-builder /app/doc/dist ./public/docplatform

# Fix line endings on entrypoint script and make executable
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 5000
ENTRYPOINT ["/app/entrypoint.sh"]
