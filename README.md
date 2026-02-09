# Implementation Documentation

## Overview

This document describes the integration work performed on the Create Agent page of the Olimi AI dashboard. The previously static UI has been connected to the mock API (`json-server` at `http://localhost:3001/api`), making the form fully functional.

---

## Tasks Completed

### Task 1: Fetch Dropdown Data from the API

Replaced all hardcoded `<SelectItem>` lists in the Basic Settings section with data fetched from the API:

- **Language dropdown** — `GET /api/languages`
- **Voice dropdown** — `GET /api/voices` (displays the `tag` field as a styled badge next to the voice name)
- **Prompt dropdown** — `GET /api/prompts` (shows description as secondary text)
- **Model dropdown** — `GET /api/models` (shows description as secondary text)

Skeleton loading placeholders are shown while the data is being fetched.

### Task 2: Implement File Upload

Replaced the client-side-only file handling with the 3-step upload flow:

1. **Request a signed URL** — `POST /api/attachments/upload-url`
2. **Upload the file** — `PUT {signedUrl}` with file binary
3. **Register the attachment** — `POST /api/attachments`

Each file displays a status indicator:

- Spinner icon while uploading
- Green checkmark when upload completes
- Red error icon with "Failed" label if upload fails

The remove button is disabled during an active upload to prevent state inconsistencies.

### Task 3: Implement Save Agent

Wired up both Save buttons (header and bottom bar) to the API:

- First save calls `POST /api/agents` and stores the returned agent ID
- Subsequent saves call `PUT /api/agents/:id` using the stored ID
- All form fields are collected into a single JSON payload including: name, description, callType, language, voice, prompt, model, latency, speed, callScript, serviceDescription, attachment IDs, and tool settings
- A success or error toast notification is shown after each save attempt
- The save button shows a loading spinner and is disabled while saving

### Task 4: Implement Test Call

Wired up the Start Test Call button:

- Validates that a phone number has been entered
- If the agent has unsaved changes or hasn't been created yet, it auto-saves first
- Calls `POST /api/agents/:id/test-call` with the test call form data (firstName, lastName, gender, phoneNumber)
- Shows the call ID on success via toast notification
- The button shows a loading spinner and changes text to "Initiating Call..." while processing

### Bonus Features

- **Unsaved changes alert** — The browser's `beforeunload` event warns the user when navigating away with unsaved changes. An "Unsaved changes" text indicator is also shown in the bottom save bar.
- **Loading states** — Skeleton placeholders are displayed for all API-fetched dropdowns while data loads and also for the whole web app. Save and Test Call buttons show spinners and are disabled during async operations.
- **Error handling** — All API calls are wrapped in try/catch blocks. Errors are displayed as toast notifications. If the reference data fetch fails entirely, an error banner is shown at the top of the form.
- **Form validation** — Required fields (Agent Name, Call Type, Language, Voice, Prompt, Model) are validated before save. Inline error messages appear below each invalid field and clear automatically when the field is filled.
- **Tools state management** — The Switch controls in the Tools section now have proper `checked` and `onCheckedChange` bindings and their values are included in the agent payload when saving.

---

## Files Modified

### `src/components/agents/agent-form.tsx`

The main form component. Changes include:

- Imported and used `useReferenceData` hook to fetch dropdown data from the API
- Imported and used API functions from `src/lib/api.ts` for save, upload, and test call operations
- Wrapped the component with `ToastProvider` for toast notifications
- Replaced hardcoded `<SelectItem>` lists with dynamically rendered items from API data
- Added skeleton loading states for dropdowns while data is being fetched
- Added form validation with inline error messages for required fields
- Implemented `handleSave` function for creating/updating agents via the API
- Implemented `handleFiles` / `uploadFile` functions for 3-step file upload
- Implemented `handleTestCall` function with auto-save logic
- Added `beforeunload` event listener for unsaved changes warning
- Added state management for tool switches (`allowHangUp`, `allowCallback`, `liveTransfer`)
- Added loading/disabled states to Save and Test Call buttons

---

## Files Created

### `src/lib/api.ts`

Centralized API client module containing:

- **TypeScript interfaces** for all API data types (`Language`, `Voice`, `Prompt`, `Model`, `Agent`, `AgentPayload`, `Attachment`, `TestCallPayload`, `TestCallResponse`, etc.)
- **`ApiError` class** — Custom error class that includes HTTP status code
- **`handleResponse` helper** — Generic response handler that checks for HTTP errors and parses JSON
- **Reference data functions** — `fetchLanguages()`, `fetchVoices()`, `fetchPrompts()`, `fetchModels()`
- **Agent CRUD functions** — `createAgent()`, `updateAgent()`
- **File upload functions** — `getUploadUrl()`, `uploadFileToSignedUrl()`, `registerAttachment()`
- **Test call function** — `initiateTestCall()`

### `src/hooks/use-reference-data.ts`

Custom React hook for fetching all dropdown reference data:

- Fetches languages, voices, prompts, and models in parallel using `Promise.all`
- Returns `{ data, isLoading, error }` for consumption by the form component
- Handles cleanup with a `cancelled` flag to prevent state updates after unmount
- Runs once on component mount via `useEffect`

### `src/components/ui/toast.tsx`

Lightweight toast notification system built with React Context:

- **`ToastProvider`** — Context provider that manages toast state and renders the toast container
- **`useToast`** — Hook that exposes the `toast(message, variant)` function
- **`ToastItem`** — Individual toast component with auto-dismiss after 4 seconds
- Supports three variants: `success` (green), `error` (red), `info` (blue)
- Each toast includes an icon, message text, and a manual dismiss button
- Toasts are positioned fixed at the bottom-right of the viewport

---

## New Libraries Installed

**None.** All functionality was implemented using libraries already present in the project:

- `react` (useState, useEffect, useCallback, useRef, createContext, useContext)
- `lucide-react` (Loader2, CheckCircle2, AlertCircle, Info icons)
- `@radix-ui/*` components via shadcn/ui (Skeleton, Badge, etc.)
- Native `fetch` API for HTTP requests

No additional npm packages were added.

---

## Architecture Decisions

1. **Separate API client** — All API calls are centralized in `src/lib/api.ts` rather than inline in the component, keeping the form component focused on UI logic and making API functions reusable and testable.

2. **Custom hook for reference data** — The `useReferenceData` hook encapsulates the data fetching logic with proper loading and error states, following established React patterns.

3. **Toast system via Context** — A lightweight toast implementation was created instead of adding a third-party library, keeping the dependency count unchanged while providing the needed notification functionality.

4. **Form-level ToastProvider** — The `ToastProvider` wraps the form component directly (via the exported `AgentForm` wrapper) rather than being added to the root layout, keeping the scope minimal and avoiding modifications to layout files.

5. **Immediate file upload** — Files are uploaded to the API immediately upon selection rather than waiting for form save, providing instant feedback and ensuring attachment IDs are available when the agent is saved.
