# MediFlow

MediFlow is an AI-assisted medical triage and appointment scheduling web application. It helps users describe their symptoms in natural language, classifies the case by urgency, asks follow-up questions when needed, and guides the user toward the right next step, whether that is an emergency redirect or a scheduled consultation.

The project combines a React frontend, an Express backend, Firebase authentication, Firestore-based workflow sessions, and an AI-powered symptom understanding and triage pipeline.

## Presentation Slide Link
https://canva.link/mediflow-fsktmhack

## Presentation + Demo Video Link
https://drive.google.com/drive/folders/1fk2ubZYBwDYHPD1Du0CBAydHk5_UIDgQ?usp=drive_link

## Features

- Natural-language symptom input for patients
- AI-assisted symptom parsing into structured medical details
- Triage classification into `EMERGENCY`, `URGENT`, or `NON-URGENT`
- Follow-up question workflow to collect missing case details
- Emergency redirection for high-risk cases
- Department and doctor matching based on symptoms
- Appointment slot selection with priority-aware scheduling
- Firebase email/password authentication
- Session persistence using Firestore
- Emergency page with first-aid guidance and nearby hospitals/clinics

## AI Used

MediFlow uses AI in two main parts of the backend workflow:

1. Input understanding agent
   Converts a user's free-text symptom description into structured data such as symptoms, duration, severity, and initial triage level.

2. Triage agent
   Evaluates the patient case and returns:
   - triage level
   - risk score
   - confidence score
   - reasoning

The current backend is integrated with `ilmu-glm-5.1` through a configurable Z.AI-compatible endpoint using `ZAI_API_KEY` and `ZAI_ENDPOINT`.

For safety and reliability, the app also includes:

- rule-based emergency overrides for red-flag symptoms such as chest pain with dizziness or shortness of breath
- fallback parsing and triage logic when the AI service is unavailable

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Firebase Web SDK

### Backend

- Node.js
- Express
- Firebase Admin SDK
- Firestore

### AI and Data

- `ilmu-glm-5.1` via Z.AI-compatible API endpoint
- JSON-based doctor, department, and slot datasets for scheduling logic

## Project Structure

```text
MediFlow/
|-- frontend/   # React + Vite web app
|-- backend/    # Express API, AI workflow, Firebase integration
`-- package.json
```

## How To Set Up And Try The Web App

### 1. Prerequisites

- Node.js 18 or above
- npm
- A Firebase project for authentication and Firestore
- A Z.AI-compatible API key for the AI workflow

### 2. Try the deployed web app

If you just want to test MediFlow without local setup, use the deployed app:

- Frontend: `https://medi-flow-fsktmhack.vercel.app/`
- Backend: `https://mediflow-bw8n.onrender.com/`

Open the frontend URL in your browser, sign up or log in, then start a triage session.

### 3. Install dependencies

From the project root:

```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 4. Configure frontend environment

Create `frontend/.env` based on `frontend/.env.example`.

Example:

```env
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_USE_FIREBASE_EMULATORS=false
```

Note:

- If you use Firebase emulators locally, set `VITE_USE_FIREBASE_EMULATORS=true`.

### 5. Configure backend environment

Create `backend/.env` and add:

```env
PORT=5000
ZAI_API_KEY=your_api_key
ZAI_ENDPOINT=https://api.z-ai.com/v1/chat/completions
ZAI_TIMEOUT_MS=30000

FIREBASE_PROJECT_ID=your-project-id
USE_FIRESTORE_EMULATOR=false

# Optional if using a Firebase service account locally
GOOGLE_APPLICATION_CREDENTIALS=path_to_service_account_json
```

Notes:

- If using Firestore emulator locally, set `USE_FIRESTORE_EMULATOR=true`.
- If you are not using default Google credentials, point `GOOGLE_APPLICATION_CREDENTIALS` to your Firebase service account JSON file.

### 6. Run the app

From the project root:

```bash
npm run dev
```

This starts:

- frontend on `http://localhost:8080`
- backend on `http://localhost:5000`

### 7. Important deployment note

For local development, the frontend currently calls the backend at `http://localhost:5000`.

For production deployment, the frontend should call your deployed backend:

`https://mediflow-526a.onrender.com`

If the deployed frontend shows backend connection errors, update the frontend API base URL configuration so production uses the Render backend instead of localhost.

### 8. Try the app

1. Open the frontend in your browser.
2. Sign up or log in with Firebase authentication.
3. Start a triage session and describe symptoms in natural language.
4. Answer any follow-up questions generated by the workflow.
5. Review the triage result.
6. If the case is not an emergency, continue to the scheduling result.

## Example Use Cases

- A patient describes symptoms like fever, headache, and vomiting, and receives an urgent triage result.
- A patient reports chest pain and dizziness, and the system redirects them to emergency care.
- A non-emergency case is matched to the correct department, doctor, and next available slot.
