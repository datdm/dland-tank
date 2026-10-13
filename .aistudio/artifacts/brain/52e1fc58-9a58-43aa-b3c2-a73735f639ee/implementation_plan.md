# Implementation Plan - User Account & Player Tank Name Synchronization

## 1. Overview & User Intent
The user reported an issue where after logging in with Google or joining a game, the in-game player/tank name does not match their logged-in Google account name or edited name. 

Based on user confirmation:
1. **Auto-sync Google Account Name**: Logging in with Google automatically sets and synchronizes the in-game tank name to the Google account name.
2. **Auto-save Name Field Edits**: Editing the player name text box on the main menu (`HomePage.tsx`) automatically updates and saves the name to the active account profile (`currentUser.name` and local storage).

---

## 2. Root Cause Analysis
1. **Unsynced State in `HomePage.tsx`**:
   - The `name` input field state in `HomePage.tsx` was initialized with a random name (`RANDOM_NAMES[...]`) on mount and was not updated when `currentUser` logged in via Google or switched accounts.
   - Editing the input field only updated local component state without calling `updateUserName` in `auth.ts` to sync `currentUser`.
2. **Disconnected Battle Entry**:
   - When starting queue or joining a match, `HomePage.tsx` passed its internal unsynced `name` state rather than `currentUser.name`.
3. **App Level Profile Inconsistency**:
   - `App.tsx` maintained a `profileRef` which wasn't always re-synchronized when `currentUser.name` changed during Google login or inline editing.

---

## 3. Proposed Changes & Architecture

### A. `src/utils/auth.ts`
- Ensure `loginWithGoogle` assigns `displayName` from Google credentials to `currentUser.name` and saves it to local storage.
- Update `updateUserName(newName)` to update both `currentUser` in memory and in `localStorage` for both Google and Guest users.
- Provide a clear helper `getCurrentUser()` that ensures any guest-to-Google account linking persists statistics while updating the display name.

### B. `src/components/HomePage.tsx`
- Add a `useEffect` watching `currentUser?.name`. Whenever `currentUser` changes (e.g. after Google sign-in or guest login), automatically update the local `name` input field state to `currentUser.name`.
- On editing the player name input box (`onChange`), immediately update local state and call `updateUserName(newName)` so the account profile stays in sync in real-time.
- Update `handleStartBattle` / `onStartQueue` to explicitly pass `currentUser?.name || name` to ensure the exact account name is sent to the battle server and game engine.

### C. `src/App.tsx`
- Ensure `handleUserChange` (triggered by Google login or name update) synchronizes `currentUser` with `profileRef.current.name`.
- Verify that multiplayer room join events and local game start handlers use `currentUser.name`.

---

## 4. Verification Plan
1. **Build & Lint Verification**:
   - Run `compile_applet` to confirm no TypeScript or Vite build errors exist.
2. **User Flow Verification**:
   - Test Guest Login: check default guest name in home screen and verify typing a new name updates account profile.
   - Test Google Login: verify Google display name automatically populates the name box and tank name in battle.
   - Test Battle Entry: start a battle/room and verify the tank label matches the logged-in account name.
