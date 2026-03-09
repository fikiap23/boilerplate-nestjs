FROM node:22.5.1-alpine3.20

WORKDIR /usr/src/app

COPY package*.json ./

COPY prisma ./prisma/

RUN npm ci

COPY . .
