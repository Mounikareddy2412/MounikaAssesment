FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
RUN mkdir -p /app/data
ENV PORT=4000
EXPOSE 4000
CMD ["node", "src/server.js"]
