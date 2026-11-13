# Home Services Dispatch System

Dispatch console for plumbing, cleaning, and painting jobs: a Node.js/Express API, a **native** React Native app (Android + iOS, no Expo), and a web app with an admin panel.

## Structure

- `server/` — REST API, JWT login with roles, JSON file store (`server/data/store.json`, created on first start)
- `client/` — React Native CLI app (login, day board, order list with filters, assign worker)
- `web/` — React + Vite web app: the same dispatcher console plus an admin panel at `/admin`

## Roles

| Role | Can do |
| --- | --- |
| `dispatcher` | View orders, workers, schedule, categories; assign workers; complete or cancel orders |
| `admin` | Everything a dispatcher can, plus create/edit/delete orders, workers, users, categories and view stats |

## Backend

```bash
cd server
npm install
npm run dev
npm test
```

API listens on `http://0.0.0.0:5000`. On first start an admin account is created. In development, if `ADMIN_PASSWORD` is not set, the demo credentials are `admin` / `123456` (a warning is logged).

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `5000` | |
| `JWT_SECRET` | dev-only fallback | **Required** when `NODE_ENV=production` |
| `ADMIN_USERNAME` | `admin` | First admin, only used when the store has no users |
| `ADMIN_PASSWORD` | `123456` in dev | **Required** when `NODE_ENV=production` |
| `CORS_ORIGINS` | `http://localhost:5173` in dev | Comma-separated browser origins allowed to call the API |
| `STORE_FILE` | `server/data/store.json` | JSON data file |
| `SERVE_WEB` | off | Set to `1` to serve `web/dist` from the API (single deployment) |

An existing `store.json` from an older version is migrated automatically on start: Russian category names become category ids (`plumbing`, `cleaning`, `painting`) and the `users` / `categories` collections are added.

### Endpoints

All routes except login require `Authorization: Bearer <token>`. Errors are `{ success: false, message }`.

| Method | Path | Role | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | — | `{ username, password }` → `{ success, token, user }`; rate limited |
| GET | `/api/auth/me` | any | Current user |
| GET | `/api/orders?category=&status=&date=&q=` | any | `category` accepts an id or a legacy Russian name |
| GET | `/api/orders/:id` | any | |
| POST | `/api/orders/:id/assign` | any | `{ workerId, date, timeSlot }` |
| POST | `/api/orders/:id/status` | any | `{ status: 'completed' \| 'cancelled' }` |
| POST | `/api/orders` | admin | Create; optional `workerId` assigns immediately |
| PATCH | `/api/orders/:id` | admin | Partial update; worker/date/slot changes re-run trade and overlap checks |
| DELETE | `/api/orders/:id` | admin | |
| GET | `/api/workers?category=&date=&timeSlot=&excludeOrderId=` | any | `busy` flag when date and slot are given |
| POST / PATCH / DELETE | `/api/workers[/:id]` | admin | `409` when the worker still has assigned orders |
| GET | `/api/schedule?date=` | any | Day board |
| GET | `/api/categories` | any | `[{ id, names: { en, ru, de }, color }]` |
| POST / PATCH / DELETE | `/api/categories[/:id]` | admin | `409` when the category is still in use |
| GET / POST / PATCH / DELETE | `/api/users[/:id]` | admin | The last active admin and your own account are protected |
| GET | `/api/stats?date=` | admin | Dashboard totals |

## Web app

```bash
cd web
npm install
npm run dev     # http://localhost:5173, proxies /api to http://localhost:5000
npm run build   # type check + production build into web/dist
npm run lint
```

Start the backend first. To call an API on another host, set `VITE_API_BASE_URL` (for example `https://api.example.com/api`) at build time and add the web origin to the server's `CORS_ORIGINS`. Alternatively build the web app and start the server with `SERVE_WEB=1` to serve both from port 5000.

## Mobile app (native)

API base URL lives in `client/api.js`. Release builds use `https://home-service-api.annaniks.com/api`; debug builds use:

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

Keep Metro running (`npm start` in `client/`) if it is not started by the run command. Categories are loaded from `/api/categories` after login, so new categories created in the admin panel appear in the app without a release.

React Native 0.88 expects **Node.js 22.13+**. If `npm start` or `run-ios`/`run-android` fails with engine warnings, switch Node (for example `nvm install 22 && nvm use 22`) and reinstall `client/` dependencies.

## Deployment

| Domain | Serves |
|---|---|
| `https://home-service.annaniks.com` | Web app (static `web/dist`); `/api/` is proxied to the API |
| `https://home-service-api.annaniks.com` | API for the mobile app |

GitHub Actions (`.github/workflows/deploy.yml`) runs server tests, web lint and build on every push and pull request. Pushes to `main` then upload a release to the server and activate it with `deploy/remote-deploy.sh`, which rolls back automatically if `/api/health` fails.

Repository secrets: `SSH_HOST`, `SSH_PORT`, `SSH_USER`, `SSH_PRIVATE_KEY` (deploy key, limited to non-interactive use in `authorized_keys`), `SSH_KNOWN_HOSTS`.

Server layout (`/var/www/home-service`):

- `releases/<timestamp>-<sha>/` — last 5 releases
- `current` → active release (nginx root and pm2 `cwd`)
- `shared/.env` — production settings and secrets (`chmod 600`, never committed)
- `shared/store.json` — data

The API runs in pm2 as `home-service-api` on `127.0.0.1:5090` (`pm2 logs home-service-api`).

One-time setup on a new server:

```bash
bash deploy/bootstrap.sh                                         # creates shared/.env with generated secrets
sudo bash /var/www/home-service/current/deploy/setup-nginx.sh   # after the first deploy: nginx sites + Let's Encrypt
```

The admin password is `ADMIN_PASSWORD` in `shared/.env`. It only seeds the admin on first start; change it afterwards in the admin panel.
