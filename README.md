# Home Services Dispatch System

Dispatch console for plumbing, cleaning, and painting jobs: a Node.js/Express API and a **native** React Native app (Android + iOS, no Expo).

## Structure

- `server/` — REST API, JWT login, in-memory mock orders
- `client/` — React Native CLI app (login, order list with category filters, assign worker)

## Backend

```bash
cd server
npm install
npm run dev
```

API listens on `http://0.0.0.0:5000`. Demo credentials: `admin` / `123456`.

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/auth/login` | `{ username, password }` → `{ success, token, user }` |
| GET | `/api/orders?category=` | Optional category filter (`Сантехника`, `Чистота`, `Покраска`) |
| GET | `/api/orders/:id` | Single order |
| POST | `/api/orders/:id/assign` | `{ workerName, date, timeSlot }` |

## Frontend (native)

API base URL lives in `client/api.js`:

- iOS Simulator → `http://localhost:5000/api`
- Android Emulator → `http://10.0.2.2:5000/api`
- Physical device → set `USE_PHYSICAL_DEVICE = true` and `LAN_IP` to your computer

```bash
cd client
npm install
cd ios && LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 bundle exec pod install && cd ..

# Android
npx react-native run-android

# iOS
npx react-native run-ios
```

Keep Metro running (`npm start` in `client/`) if it is not started by the run command.

React Native 0.88 expects **Node.js 22.13+**. If `npm start` or `run-ios`/`run-android` fails with engine warnings, switch Node (for example `nvm install 22 && nvm use 22`) and reinstall `client/` dependencies.
