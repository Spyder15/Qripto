FROM node:24-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx hardhat compile
ENV PORT=10000 DISPUTE_WINDOW=60
EXPOSE 10000
CMD ["npm", "run", "dev"]
