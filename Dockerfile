# Use an official Node.js runtime as a parent image
FROM node:16

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files for both server and shared folders
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/

# Install dependencies for both server and shared folders
RUN cd server && npm install
RUN cd shared && npm install

# Copy the rest of the server and shared code
COPY server/ ./server/
COPY shared/ ./shared/

# Generate Prisma client
RUN cd shared && npx prisma generate
# Copy the prisma folder to dist/shared/
COPY shared/prisma ./server/dist/shared/prisma

# Build the server code
RUN cd server && npm run build

# Set the working directory to the server
WORKDIR /usr/src/app/server
ENV NODE_PATH=./shared/dist

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD [ "node", "dist/server/src/index.js" ]
