# CodeMentor Mobile App Setup Guide

## Running the app across multiple devices

If you're having trouble with the app only running on `localhost:8081`, follow these steps:

### Option 1: Using Expo Tunnel (Recommended for external devices)

This creates a tunnel that allows external devices to connect to your local development server:

```bash
npm run start
# or
expo start --tunnel
```

### Option 2: Using LAN mode

This allows devices on the same network to access your development server:

```bash
npm run start-lan
# or
expo start --lan
```

### Option 3: Local host only

Only use this for web development or emulators on the same machine:

```bash
npm run start-localhost
# or
expo start
```

## Common Issues & Solutions

### Issue: App only works on localhost:8081

This happens because the Expo development server is only binding to the localhost interface. Using the `--tunnel` or `--lan` option when starting the app will resolve this.

### Issue: Cannot connect to API server

Make sure you have the correct API URL configured. The app will use:
1. The URL set in environment variables, if available
2. The fallback URL (https://codementor-b244.onrender.com)

### Issue: QR code does not work

- Make sure your phone and development machine are on the same network (for LAN mode)
- Try using tunnel mode instead (`npm run start`)
- Ensure the Expo Go app is installed on your mobile device
