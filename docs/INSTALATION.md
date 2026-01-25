# Instalation Instructions
In this guide, you will find a step-by-step overview that explains how to install the project on your local machine, configure all required dependencies, and set up the environment so you can start using the application quickly and correctly.

> To successfully set up this application, you will need: Node.js installed, an SMTP provider, and a MongoDB connection.

## Instalation
Installing this service is relatively simple. Just follow these steps:

1. Clone the repo 
```bash
git clone https://github.com/joelmohh/uptimepage
cd uptimepage
```
2. Set up the `.env` file with the following variables:
```.env
MONGODB_URI=not_mine

# Satus Update Notification Email
UPDATE_EMAIL=me@joelmo.dev

# Auth Data
AUTH_USER=joelmo
AUTH_PASS=create_one

# JWT Secret
JWT_SECRET=create_one
```
3. Install dependencies and start the server
```bash
npm install 
npm run dev
```

And once the project is set up, you can start configuring the sites to be monitored and other settings. See [SETUP.md](SETUP.md) for more information.

