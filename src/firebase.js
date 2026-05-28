// ── firebase.js ───────────────────────────────────────────────────────────────
// Auro Firebase v9 modular initialisation + auth helpers
// Place this file at: src/firebase.js
 
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  deleteUser,
  onAuthStateChanged,
  reload,
} from "firebase/auth";
 
// ── Config ────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyC5hBgG2Yg5ql5XZEa3K_7cqh63zxsGwTw",
  authDomain: "auro-929ae.firebaseapp.com",
  projectId: "auro-929ae",
  storageBucket: "auro-929ae.firebasestorage.app",
  messagingSenderId: "270235945851",
  appId: "1:270235945851:web:f1073bccc7eeb199a78bde",
  measurementId: "G-41EJB4KNNJ",
};
 
// ── Init ──────────────────────────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export { reload }; // re-exported so App.jsx can call reload(user) directly
 
// ── Auth helpers ──────────────────────────────────────────────────────────────
 
/**
 * Sign up a new user with email + password.
 * Sends a real verification email automatically.
 * Returns { user } on success or throws a FirebaseError.
 */
export async function signUp(email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(credential.user);
  return credential.user;
}
 
/**
 * Sign in an existing user.
 * Returns the Firebase User object or throws a FirebaseError.
 */
export async function signIn(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}
 
/**
 * Reload the current user from Firebase and return the fresh emailVerified flag.
 * Call this when the user clicks "I've verified my email".
 */
export async function checkEmailVerified() {
  const user = auth.currentUser;
  if (!user) return false;
  await reload(user);
  return auth.currentUser.emailVerified;
}
 
/**
 * Resend a verification email to the currently signed-in (unverified) user.
 */
export async function resendVerificationEmail() {
  const user = auth.currentUser;
  if (!user) throw new Error("No user signed in.");
  await sendEmailVerification(user);
}
 
/**
 * Sign out the current user.
 */
export async function firebaseSignOut() {
  await signOut(auth);
}
 
/**
 * Permanently delete the current user's Firebase account.
 * Note: Firebase requires recent sign-in for this; prompt re-auth if it throws
 * auth/requires-recent-login.
 */
export async function firebaseDeleteAccount() {
  const user = auth.currentUser;
  if (!user) throw new Error("No user signed in.");
  await deleteUser(user);
}
 
/**
 * Subscribe to auth state changes.
 * Returns the unsubscribe function.
 *
 * Usage:
 *   const unsub = onAuthChange((user) => { ... });
 *   // call unsub() to clean up
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
 
// ── Firebase error → human-readable message ───────────────────────────────────
export function friendlyAuthError(error) {
  const code = error?.code || "";
  const map = {
    "auth/email-already-in-use":    "An account with this email already exists.",
    "auth/invalid-email":           "Please enter a valid email address.",
    "auth/weak-password":           "Password must be at least 6 characters.",
    "auth/user-not-found":          "No account found with this email.",
    "auth/wrong-password":          "Incorrect password. Please try again.",
    "auth/invalid-credential":      "Incorrect email or password.",
    "auth/too-many-requests":       "Too many attempts. Please wait a moment and try again.",
    "auth/network-request-failed":  "Network error. Check your connection.",
    "auth/requires-recent-login":   "Please sign out and sign back in before doing this.",
    "auth/user-disabled":           "This account has been disabled.",
  };
  return map[code] || "Something went wrong. Please try again.";
}
