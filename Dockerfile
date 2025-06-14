FROM node:20-bullseye

# Créer le répertoire de travail
WORKDIR /app

# Copier les fichiers du projet
COPY package.json ./

# Installer yarn uniquement s'il n'est pas déjà installé
RUN command -v yarn || npm install -g yarn

# Installer les dépendances du projet
RUN yarn install

# Installer Expo CLI globalement
RUN npm install -g @expo/cli

# Nettoyer le cache et mettre à jour les packages Expo
RUN yarn cache clean
RUN npx expo install --fix

COPY . .

# Exposer les ports utilisés par Expo
EXPOSE 19000 19001 19002 8081

# Commande de démarrage
CMD ["npx", "expo", "start", "--host", "lan"]