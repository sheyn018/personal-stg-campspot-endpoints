# This is used to deploy to app on some server.
FROM oven/bun:latest

# Set the working directory
WORKDIR /app

# Dockerfile

# Use the build args passed during docker build
ARG PORT
ARG MOTHER_SECRET
# Set them as environment variables
ENV PORT=$PORT
ENV MOTHER_SECRET=$MOTHER_SECRET

# Copy package.json and tsconfig.json
COPY package.json tsconfig.json ./
# COPY src/script.ts ./src/script.ts

# Install dependencies
RUN bun install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE ${PORT}

# Command to run the app
CMD ["bun", "run", "start"]
