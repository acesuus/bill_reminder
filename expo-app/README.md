# Bill Reminder (Expo)

An offline-first bill reminder app built with **Expo (React Native + TypeScript)**.
This is a port of the original Flutter `bill_reminder` app, preserving the same
visual design, screens, and feature set.

## Features

- **Offline-first** — all data is stored locally on the device with SQLite
  (`expo-sqlite`). No network connection is ever required.
- **Name-based local sign-in** — enter a name to continue; the user is created
  automatically on first use. The session is persisted with `AsyncStorage`.
- **Dashboard** with filter chips: `All`, `This Month`, `This Year`, `Expired`.
  Expired-and-unpaid bills are highlighted in red.
- **Add / edit / delete bills** — title, amount (peso `₱`), due date, and a
  "Mark as Paid" toggle.
- **Bill photos** — capture front/back images with the camera; files are copied
  into the app's document directory.
- **Local notifications** — schedules a reminder at 9:00 AM on the due date
  (`expo-notifications`), with an optional high-priority "alarm".

## Tech stack

| Concern        | Library                                   |
| -------------- | ----------------------------------------- |
| Navigation     | `expo-router` (file-based)                |
| Local database | `expo-sqlite`                             |
| Session store  | `@react-native-async-storage/async-storage` |
| Notifications  | `expo-notifications`                      |
| Camera         | `expo-image-picker`                       |
| File storage   | `expo-file-system`                        |
| Date picker    | `@react-native-community/datetimepicker`  |
| Gradients      | `expo-linear-gradient`                    |

## Project structure

```
expo-app/
├── app/                     # expo-router screens (file-based routing)
│   ├── _layout.tsx          # Root stack + providers + notification init
│   ├── index.tsx            # Auth gate (redirects to /home or /auth)
│   ├── auth.tsx             # Name sign-in screen
│   ├── home.tsx             # Dashboard (filters + bill cards)
│   ├── add-bill.tsx         # Create a bill
│   └── edit-bill.tsx        # Edit / delete a bill
├── src/
│   ├── context/AuthContext.tsx   # Local auth + session persistence
│   ├── db/database.ts            # SQLite schema + CRUD
│   ├── services/notifications.ts # Schedule / cancel reminders
│   ├── theme/colors.ts           # Shared palette (ported from Flutter)
│   ├── types/bill.ts             # Domain models
│   └── utils/                    # date + image helpers
├── app.json
├── package.json
└── tsconfig.json
```

## Getting started

> Requires Node.js 18+ and the Expo tooling.

```bash
cd expo-app

# 1. Install dependencies
npm install

# 2. (Recommended) Align native package versions to the installed Expo SDK.
#    This auto-corrects any version mismatches in package.json.
npx expo install --fix

# 3. Start the dev server
npx expo start
```

Then open the app in **Expo Go** (scan the QR code) or run it on a simulator.

### Notes on native features

- **Notifications** and the **camera** require a physical device or a dev
  build. Scheduled local notifications and the camera have limited or no
  support in the web target and in some simulators.
- On Android 13+ the app requests notification permission at runtime; on
  Android 14+ exact-alarm scheduling is used for due-date reminders.

## Mapping from the Flutter app

| Flutter file              | Expo equivalent                     |
| ------------------------- | ----------------------------------- |
| `main.dart`               | `app/_layout.tsx`                   |
| `auth_gate.dart`          | `app/index.tsx`                     |
| `auth_screen.dart`        | `app/auth.tsx`                      |
| `auth_service.dart`       | `src/context/AuthContext.tsx`       |
| `home_screen.dart`        | `app/home.tsx`                      |
| `add_bill_screen.dart`    | `app/add-bill.tsx`                  |
| `edit_bill_screen.dart`   | `app/edit-bill.tsx`                 |
| `database_helper.dart`    | `src/db/database.ts`                |
| `notification_service.dart` | `src/services/notifications.ts`   |
| `bill_model.dart`         | `src/types/bill.ts`                 |
