# Ejecutivo Express.js server
# ----------------------------------------------
FROM node:20-alpine

WORKDIR /usr/src/app
COPY package.json ./
RUN apk update
RUN apk upgrade
RUN apk add --no-cache ffmpeg
RUN npm install --only=production
COPY . .

EXPOSE 8080

CMD ["node", "app.js"]