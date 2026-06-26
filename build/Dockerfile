FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/

RUN npm ci

COPY . .
