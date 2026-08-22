import React, { useState } from "react";
import { useSignIn } from "@clerk/clerk-react";

export default function SignIn({ onNavigate }) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    if (!email || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      } else {
        console.log("Status incomplete:", result);
        setErrorMsg("Authentication requirements incomplete. Please check your account settings.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.errors?.[0]?.longMessage || err.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: window.location.origin,
      });
    } catch (err) {
      console.error(err);
      setErrorMsg(err.errors?.[0]?.longMessage || err.message || "Could not sign in with Google.");
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo-badge">AI</div>
        <div className="subtitle">CCTV Intelligence System</div>
        <h2>SIGN IN</h2>
        <p className="desc">Sign in to access the investigation dashboard</p>

        {errorMsg && <div className="auth-error-box">{errorMsg}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-group">
            <label>Email Address</label>
            <input
              type="email"
              className="auth-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="auth-group">
            <label>Password</label>
            <div className="auth-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="auth-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="auth-input-eye"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <div className="auth-meta">
            <label className="auth-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              Remember me
            </label>
            <a
              href="#forgot"
              className="auth-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("forgot-password");
              }}
            >
              Forgot password?
            </a>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <div className="auth-divider">OR</div>

        <button
          type="button"
          className="auth-oauth-btn"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <span style={{ fontSize: "16px" }}>🌐</span> Continue with Google
        </button>

        <div className="auth-footer">
          Don't have an account?{" "}
          <a
            href="#signup"
            className="auth-link"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("signup");
            }}
          >
            Create account
          </a>
        </div>
      </div>
    </div>
  );
}
