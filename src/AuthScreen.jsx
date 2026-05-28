// ── AuthScreen.jsx ────────────────────────────────────────────────────────────
// Full auth flow: Sign In / Sign Up / Email Verification
// Matches Auro's premium dark futuristic design exactly.
// Place this file at: src/AuthScreen.jsx

import { useState } from "react";
import {
  signUp,
  signIn,
  checkEmailVerified,
  resendVerificationEmail,
  firebaseSignOut,
  friendlyAuthError,
} from "./firebase";

// ── Design tokens (mirror income-advisor-v6.jsx) ───────────────────────────────
const T = {
  bg:           "#070708",
  surface:      "#0d0d0f",
  card:         "#111114",
  border:       "#1f1e24",
  primary:      "#4a9eff",
  gold:         "#f5c842",
  goldDim:      "#c9920e",
  text:         "#f0ece0",
  muted:        "#6a6455",
  dim:          "#2e2b24",
  gradPrimary:  "linear-gradient(135deg,#f5c842,#e08800)",
  gradDual:     "linear-gradient(135deg,#f5c842 0%,#c9920e 40%,#4a9eff 100%)",
  gradHero:     "linear-gradient(160deg,#07060a 0%,#080709 40%,#060709 100%)",
};

// ── Inline styles shared across sub-screens ────────────────────────────────────
const inputStyle = {
  width: "100%",
  padding: "13px 15px",
  borderRadius: 13,
  border: `1.5px solid ${T.border}`,
  background: T.card,
  color: T.text,
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

const primaryBtnStyle = (disabled) => ({
  width: "100%",
  padding: "15px",
  borderRadius: 14,
  border: "none",
  fontFamily: "inherit",
  background: disabled ? T.dim : T.gradPrimary,
  color: disabled ? T.muted : "#0a0800",
  fontSize: 15,
  fontWeight: 900,
  cursor: disabled ? "default" : "pointer",
  transition: "all 0.2s",
  boxShadow: disabled ? "none" : `0 0 24px ${T.gold}40`,
  letterSpacing: 0.3,
});

const ghostBtnStyle = {
  width: "100%",
  padding: "13px",
  borderRadius: 13,
  border: `1px solid ${T.border}`,
  fontFamily: "inherit",
  background: "transparent",
  color: T.muted,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s",
};

function GlowOrb({ x, y, color, size = 300, opacity = 0.07 }) {
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: size, height: size,
      borderRadius: "50%", background: color, filter: "blur(80px)",
      opacity, pointerEvents: "none", zIndex: 0,
    }} />
  );
}

function ErrorBanner({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      background: "#450a0a", border: "1px solid #f8717160",
      borderRadius: 11, padding: "11px 14px", marginBottom: 16,
      fontSize: 13, color: "#f87171", lineHeight: 1.45,
      animation: "fadeIn 0.25s ease",
    }}>
      ⚠ {msg}
    </div>
  );
}

// ── Sign In ────────────────────────────────────────────────────────────────────
function SignInForm({ onSuccess, onSwitchToSignUp }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setError(""); setLoading(true);
    try {
      const user = await signIn(email, password);
      onSuccess(user);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.35s ease" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{
          fontSize: 26, fontWeight: 900, color: T.text,
          margin: "0 0 8px", fontFamily: "Georgia,serif",
          background: T.gradDual, WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          Welcome back
        </h2>
        <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
          Sign in to continue building your income.
        </p>
      </div>

      <ErrorBanner msg={error} />

      {/* Email */}
      <div style={{ marginBottom: 13 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 7 }}>
          Email
        </label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={inputStyle}
          autoComplete="email"
        />
      </div>

      {/* Password */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 7 }}>
          Password
        </label>
        <input
          type="password"
          placeholder="Your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={inputStyle}
          autoComplete="current-password"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={primaryBtnStyle(loading)}
      >
        {loading ? "Signing in…" : "Sign In →"}
      </button>

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <span style={{ fontSize: 13, color: T.muted }}>New to Auro? </span>
        <span
          onClick={onSwitchToSignUp}
          style={{ fontSize: 13, color: T.primary, cursor: "pointer", fontWeight: 700 }}
        >
          Create account
        </span>
      </div>
    </div>
  );
}

// ── Sign Up ────────────────────────────────────────────────────────────────────
function SignUpForm({ onSuccess, onSwitchToSignIn }) {
  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const handleSubmit = async () => {
    if (!name || !email || !password || !confirm) {
      setError("Please fill in all fields."); return;
    }
    if (password !== confirm) {
      setError("Passwords do not match."); return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }
    setError(""); setLoading(true);
    try {
      const user = await signUp(email, password);
      onSuccess(user, name);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.35s ease" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{
          fontSize: 26, fontWeight: 900, color: T.text,
          margin: "0 0 8px", fontFamily: "Georgia,serif",
          background: T.gradDual, WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          Create your account
        </h2>
        <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
          Your income journey starts here.
        </p>
      </div>

      <ErrorBanner msg={error} />

      {/* Name */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 7 }}>
          Your Name
        </label>
        <input
          type="text"
          placeholder="Alex Johnson"
          value={name}
          onChange={e => setName(e.target.value)}
          style={inputStyle}
          autoComplete="name"
        />
      </div>

      {/* Email */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 7 }}>
          Email
        </label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
          autoComplete="email"
        />
      </div>

      {/* Password */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 7 }}>
          Password
        </label>
        <input
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={inputStyle}
          autoComplete="new-password"
        />
      </div>

      {/* Confirm */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 7 }}>
          Confirm Password
        </label>
        <input
          type="password"
          placeholder="Repeat your password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={inputStyle}
          autoComplete="new-password"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={primaryBtnStyle(loading)}
      >
        {loading ? "Creating account…" : "Create Account →"}
      </button>

      {/* Terms note */}
      <p style={{ fontSize: 11, color: T.muted, textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>
        By creating an account you agree to our{" "}
        <span
          style={{ color: T.primary, cursor: "pointer" }}
          onClick={() => window.open("https://auro.app/terms", "_blank")}
        >
          Terms
        </span>{" "}
        and{" "}
        <span
          style={{ color: T.primary, cursor: "pointer" }}
          onClick={() => window.open("https://auro.app/privacy", "_blank")}
        >
          Privacy Policy
        </span>.
      </p>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <span style={{ fontSize: 13, color: T.muted }}>Already have an account? </span>
        <span
          onClick={onSwitchToSignIn}
          style={{ fontSize: 13, color: T.primary, cursor: "pointer", fontWeight: 700 }}
        >
          Sign in
        </span>
      </div>
    </div>
  );
}

// ── Email Verification Pending ─────────────────────────────────────────────────
function VerificationPending({ email, onVerified, onSignOut }) {
  const [checking, setChecking]   = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent]       = useState(false);
  const [error, setError]         = useState("");

  const handleCheck = async () => {
    setChecking(true); setError("");
    try {
      const verified = await checkEmailVerified();
      if (verified) {
        onVerified();
      } else {
        setError("Email not yet verified. Check your inbox (and spam folder) and click the link.");
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setResending(true); setError("");
    try {
      await resendVerificationEmail();
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "8px 0 24px", animation: "fadeIn 0.4s ease" }}>
      {/* Icon */}
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: `${T.primary}15`, border: `2px solid ${T.primary}40`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 36, margin: "0 auto 22px",
        boxShadow: `0 0 30px ${T.primary}20`,
      }}>
        ✉️
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: "0 0 10px", fontFamily: "Georgia,serif" }}>
        Verify Your Email
      </h2>
      <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, marginBottom: 6 }}>
        We sent a verification link to
      </p>
      <p style={{ fontSize: 14, fontWeight: 700, color: T.primary, marginBottom: 20 }}>
        {email}
      </p>
      <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.65, marginBottom: 24 }}>
        Open the link in that email to verify your account.
        Check your spam folder if you don't see it within a minute.
      </p>

      <ErrorBanner msg={error} />

      {/* Check verified */}
      <button
        onClick={handleCheck}
        disabled={checking}
        style={{ ...primaryBtnStyle(checking), marginBottom: 12 }}
      >
        {checking ? "Checking…" : "I've Verified My Email →"}
      </button>

      {/* Resend */}
      <button
        onClick={handleResend}
        disabled={resending || resent}
        style={{
          ...ghostBtnStyle,
          color: resent ? "#34d399" : T.muted,
          marginBottom: 22,
        }}
      >
        {resent ? "✓ Email Resent!" : resending ? "Sending…" : "Resend Verification Email"}
      </button>

      <p style={{ fontSize: 11, color: T.dim }}>
        Wrong email?{" "}
        <span style={{ color: T.primary, cursor: "pointer" }} onClick={onSignOut}>
          Sign out and try again
        </span>
      </p>
    </div>
  );
}

// ── AuthScreen (root export) ───────────────────────────────────────────────────
// onAuthenticated(user, displayName) is called when the user is fully verified.
export default function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup" | "verify"
  const [pendingUser, setPendingUser]   = useState(null);
  const [pendingName, setPendingName]   = useState("");

  // After sign-in: if already verified, go straight into app; else show verify screen.
  const handleSignInSuccess = (user) => {
    if (user.emailVerified) {
      onAuthenticated(user, user.displayName || user.email.split("@")[0]);
    } else {
      setPendingUser(user);
      setMode("verify");
    }
  };

  // After sign-up: always show verify screen (email just sent by signUp helper).
  const handleSignUpSuccess = (user, name) => {
    setPendingUser(user);
    setPendingName(name);
    setMode("verify");
  };

  // User confirmed verified.
  const handleVerified = () => {
    const user = pendingUser;
    const name = pendingName || user?.displayName || user?.email?.split("@")[0] || "User";
    onAuthenticated(user, name);
  };

  // Sign out from verify screen so user can re-enter a different email.
  const handleSignOutFromVerify = async () => {
    try {
      await firebaseSignOut();
    } catch (_) {}
    setPendingUser(null);
    setPendingName("");
    setMode("signin");
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${T.bg}; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color: ${T.text}; -webkit-font-smoothing: antialiased; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        input:focus { border-color: ${T.gold} !important; }
        button:active { opacity: 0.82; transform: scale(0.97) !important; }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-track { background: ${T.bg} }
        ::-webkit-scrollbar-thumb { background: ${T.dim}; border-radius: 2px }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: T.gradHero,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px 48px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background glows */}
        <GlowOrb x="-60px" y="-40px" color={T.gold} size={400} opacity={0.08} />
        <GlowOrb x="60%" y="50%" color={T.primary} size={300} opacity={0.06} />

        {/* Card */}
        <div style={{
          width: "100%",
          maxWidth: 440,
          background: T.surface,
          borderRadius: 26,
          padding: "32px 26px",
          border: `1px solid ${T.border}`,
          boxShadow: "0 24px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03)",
          position: "relative",
          zIndex: 1,
        }}>
          {/* Brand mark */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28, gap: 10 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 15,
              background: `linear-gradient(135deg,${T.gold}40,${T.primary}40)`,
              border: `1.5px solid ${T.gold}50`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, boxShadow: `0 0 28px ${T.gold}25`,
            }}>
              ⚡
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 20, fontWeight: 900, letterSpacing: 3,
                fontFamily: "Georgia,serif",
                background: T.gradDual,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                AURO
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: T.muted, textTransform: "uppercase", marginTop: 3 }}>
                Income Intelligence
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: T.border, marginBottom: 26 }} />

          {/* Mode router */}
          {mode === "signin" && (
            <SignInForm
              onSuccess={handleSignInSuccess}
              onSwitchToSignUp={() => setMode("signup")}
            />
          )}
          {mode === "signup" && (
            <SignUpForm
              onSuccess={handleSignUpSuccess}
              onSwitchToSignIn={() => setMode("signin")}
            />
          )}
          {mode === "verify" && (
            <VerificationPending
              email={pendingUser?.email || ""}
              onVerified={handleVerified}
              onSignOut={handleSignOutFromVerify}
            />
          )}
        </div>

        <p style={{ fontSize: 11, color: T.muted, marginTop: 20, opacity: 0.5 }}>
          Auro v1.0.0 · Secured by Firebase
        </p>
      </div>
    </>
  );
}
