# Firebase Auth Setup

ISM now expects users to sign in with Google before syncing with Firebase.

## 1. Enable Google Sign-In

In Firebase Console:

1. Open project `booking-manager-d44a6`.
2. Go to Authentication.
3. Open Sign-in method.
4. Enable Google provider.
5. Save.

## 2. Add Authorized Domains

In Authentication settings, add the domains where ISM is served.

Typical domains:

```text
liliantomita-cloud.github.io
localhost
127.0.0.1
```

## 3. Configure Realtime Database Rules

Use `firebase.rules.example.json` as the starting point.

Replace these placeholder emails:

```text
lilian@example.com
agent@example.com
```

with the real Google account emails allowed to use ISM.

Example shape:

```json
".read": "auth != null && (auth.token.email == 'lilian@company.com' || auth.token.email == 'agent@company.com')"
```

## 4. App Behavior

- The app shows `auth Sign in` in the top bar until the user signs in.
- Firebase sync starts only after Google sign-in succeeds.
- The team workspace defaults to `/ism/anyway-travel-team/`.
- The client-side email list in `index.html` is only a usability hint. Firebase Rules are the real protection.
