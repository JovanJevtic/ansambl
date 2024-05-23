# Use a stable Node.js runtime as a parent image
FROM node:22.2

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json, package-lock.json and tsconfig.json files
COPY package*.json ./
COPY tsconfig.json ./

# Copy server and shared package.json files
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/

# Install root dependencies
RUN npm install

# Install server dependencies
RUN cd server && npm install

# Install shared dependencies
RUN cd shared && npm install

# Copy the rest of the server and shared code
COPY server/ ./server/
COPY shared/ ./shared/

# Install dependencies for server and shared
RUN cd server && npm install
RUN cd shared && npm install

RUN cd shared && npx prisma generate

# RUN set +e \
#     && npx tsc -p . \
#     && set -e

# RUN set +e \
#     && cp -r ./shared/prisma ./dist/shared/prisma \
#     && set -e

RUN npx tsc -p . && cp -r ./shared/prisma ./dist/shared/prisma

# RUN cp -r ./shared/prisma ./dist/shared/prisma


RUN mv /usr/src/app/server/node_modules /usr/src/app/dist/server/
RUN mv /usr/src/app/shared/node_modules /usr/src/app/dist/shared/

RUN mv /usr/src/app/shared/.env /usr/src/app/dist/shared/
RUN mv /usr/src/app/server/.env /usr/src/app/dist/server/

# Set the working directory to the built server 
WORKDIR /usr/src/app/dist/server/
ENV NODE_ENV=prod

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app
CMD [ "node", "src/index.js" ]
