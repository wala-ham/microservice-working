FROM node:8-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm install



COPY . .

EXPOSE 8080
CMD ["node", "index.js"]

