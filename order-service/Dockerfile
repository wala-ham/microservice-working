FROM node:8-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm install jsonwebtoken



COPY . .

EXPOSE 9090
CMD ["node", "index.js"]

