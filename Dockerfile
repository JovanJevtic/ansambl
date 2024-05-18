# Use an official Node.js runtime as a parent image
FROM node:lts

# Set the working directory
WORKDIR /usr/src/app

# Copy server package files and install dependencies
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy shared package files and install dependencies
COPY shared/package*.json ./shared/
RUN cd shared && npm install

# Copy the rest of the application code
COPY server/ ./server/
COPY shared/ ./shared/

# Generate Prisma client
RUN cd shared && npx prisma generate

# Set working directory to server
WORKDIR /usr/src/app/server

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD [ "npm", "start" ]
