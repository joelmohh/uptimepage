# UptimePage

UptimePage is a monitoring system that checks the availability of your personal projects and sends email notifications when a service goes offline.

It is a simple self-hosted uptime monitor for developers.

## Features

- Monitor multiple services (URLs)
- Configurable check interval
- Timeout detection
- Email alerts when a service is offline
- REST API to manage monitored services
- MongoDB persistence

## Requirements

- Node.js (v16+ recommended)
- MongoDB connection URL
- SMTP email service (Gmail, Outlook, etc.)

## Installation

```bash
git clone https://github.com/joelmohh/uptimepage
cd uptimepage
npm install
npm start
```
## Environment Variables

Create a `.env` file with the following:

```.env
MONGODB_URI=your

# Satus Update Notification Email
UPDATE_EMAIL=me@joelmo.dev

# Auth Data
AUTH_USER=joelmo
AUTH_PASS=yourpass

# JWT Secret
JWT_SECRET=createone

# SMTP Configuration
SMTP_HOST=none
SMTP_PORT=none
SMTP_USER=me@joelmo.dev
SMTP_PASS=c
```


## Adding sites to monitoring

Send a POST request to:

**POST**  `/api/services`

### Body example:

```json
{
  "service_name": "Portfolio",
  "url": "https://joelmo.dev/",
  "interval": "2",
  "timeout": "2400"
}
```
Start the project with 
`npm start`