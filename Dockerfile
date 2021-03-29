FROM node:12.18.3

# Create a directory where our app will be placed
RUN mkdir -p /usr/src/app

# Change directory so that our commands run inside this new directory
WORKDIR /usr/src/app

# Copy package(-lock).json
COPY package*.json /usr/src/app/

# Install npm dependencies
RUN npm install --quiet

# Copy over AvBot code
COPY . /usr/src/app/

# Expose PORT 80 for the express server
EXPOSE 80

# Start
ENTRYPOINT npm run start
