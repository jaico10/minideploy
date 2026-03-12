FROM node:18-slim

WORKDIR /app/front

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Use a simple server to serve the static files
RUN npm install -g serve
EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]
