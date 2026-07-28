FROM node:20-bullseye

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

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy application files
COPY . .

# Copy and prepare entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN sed -i 's/\r$//' /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose backend port
EXPOSE 5000

# Set entrypoint to our custom script that starts daemon + node
ENTRYPOINT ["/app/entrypoint.sh"]
