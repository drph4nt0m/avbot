FROM node:15.13.0

# Create a directory where our app will be placed
RUN mkdir -p /avbot

# Change directory so that our commands run inside this new directory
WORKDIR /avbot

# Copy package(-lock).json
COPY package*.json /avbot/

# Install npm dependencies
RUN npm install --quiet

# Copy over AvBot code
COPY . /avbot/

# Expose PORT 80 for the express server
EXPOSE 80

# Start
ENTRYPOINT npm run start
