FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Install curl
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Run the app
USER bun
EXPOSE 5000/tcp
CMD ["bun", "run", "start"]