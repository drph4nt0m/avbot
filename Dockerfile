FROM node:12.18.3

WORKDIR /usr/src/app

# Copy package(-lock).json
COPY package*.json /usr/src/app/

RUN apt -y update
RUN apt install -y ffmpeg

# RUN apt -y install curl dirmngr apt-transport-https lsb-release ca-certificates

# Install npm dependencies
RUN npm install --quiet

# Copy over AvBot code
COPY . .