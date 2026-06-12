// ============ Firebase project config ============
// Accounts & cloud login are powered by Firebase (free tier).
// Until a config is pasted here, the Account panel shows "coming soon"
// and the app works exactly as before (local + gist sync).
//
// To switch accounts on:
//   1. console.firebase.google.com → Add project (no Analytics needed)
//   2. Build → Authentication → Get started → enable Email/Password and Google
//   3. Build → Firestore Database → Create (production mode), then in Rules paste:
//        rules_version = '2';
//        service cloud.firestore {
//          match /databases/{database}/documents {
//            match /users/{uid} {
//              allow read, write: if request.auth != null && request.auth.uid == uid;
//            }
//          }
//        }
//   4. Authentication → Settings → Authorized domains → add: bubbleduck10.github.io
//   5. Project settings → Your apps → Web app (</>) → copy the firebaseConfig
//      object and assign it below.

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBPHCNKa5Z3AuOsx1sm1tqRH0YQKYAjZcw",
  authDomain: "life-dashboard-cfcd6.firebaseapp.com",
  projectId: "life-dashboard-cfcd6",
  storageBucket: "life-dashboard-cfcd6.firebasestorage.app",
  messagingSenderId: "446833678045",
  appId: "1:446833678045:web:fcf8c813b938a436042d34",
};
