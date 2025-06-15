# Welcome to SUPCHAT-Mobile

## Requirement

Install LTS of node.js on https://nodejs.org/en

Install the expo go app on your phone from the playstore/appstore or by following this link : [https://expo.dev/go](https://expo.dev/go)

Modify .env file :
```bash
EXPO_PUBLIC_IP_ADDRESS=192.168.1.10 <-- Your IP address
```

## Get started

1. Install dependencies

   ```bash
   npm install -g yarn
   yarn install
   yarn add expo
   npx expo install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

   Here an exemple of what you get when you launch the mobile app :

   ```bash
   ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
   █ ▄▄▄▄▄ █▀▄█▀ ██ ▄█ ▄▄▄▄▄ █
   █ █   █ █▄   ▄██▀ █ █   █ █
   █ █▄▄▄█ █ ▀█▀██▀ ██ █▄▄▄█ █
   █▄▄▄▄▄▄▄█ ▀▄█ █▄█▄█▄▄▄▄▄▄▄█
   █ ▄▀ ▀█▄ ▀█ ▀█▄▀▄▄▀  ▄▀▄▄▀█
   ██  ▄▄ ▄█ ▄▄██  ▀▄▄▀ ▀▀█▄▄█
   ██  ██▀▄▀▄▀▀▀ ▄ █▀█ ▄█ ██▀█     <-- Scan this with your expo app>
   █▄▀▀██▄▄█▄█ █ ▀██ ▄▄ ▀▀██▄█
   █▄▄██▄▄▄▄ ▀█▄██▄  ▄▄▄ █ ▄ █
   █ ▄▄▄▄▄ █▄ █▀██▄  █▄█  ▀▄ █
   █ █   █ █▀█    ▀▀▄ ▄▄ █▀█▄█
   █ █▄▄▄█ █▀██   ▄█  █▄  ▄█▄█
   █▄▄▄▄▄▄▄█▄▄▄▄▄█▄█▄███▄▄█▄▄█

   › Metro waiting on exp://192.168.1.10:8081
   › Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

   › Web is waiting on http://localhost:8081

   › Using Expo Go
   › Press s │ switch to development build

   › Press a │ open Android <-- To open on an Adroid VM 
   › Press w │ open web

   › Press j │ open debugger
   › Press r │ reload app <-- Reload the app in the event of a bug / probleme
   › Press m │ toggle menu
   › shift+m │ more tools
   › Press o │ open project code in your editor

   › Press ? │ show all commands

   Logs for your project will appear below. Press Ctrl+C to exit.
   ```
## Login to the app

The admin account is automatically created with the back-end , you can connect to it with those credentials :

Login : admin@supchat.com

Password : Soleil123!