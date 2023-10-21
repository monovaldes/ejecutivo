# Ejecutivo Express.js server
# ----------------------------------------------
FROM node:20-alpine

WORKDIR /usr/src/app
COPY backend/package.json ./
RUN npm install --only=production
COPY backend .

CMD ["node", "app.js"]