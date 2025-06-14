FROM node:20-bullseye

WORKDIR /app

COPY package.json ./

RUN command -v yarn || npm install -g yarn

RUN yarn install

RUN npm install -g @expo/cli

RUN yarn cache clean
RUN npx expo install --fix

COPY . .

EXPOSE 19000 19001 19002 8081

CMD ["npx", "expo", "start", "--host", "lan"]