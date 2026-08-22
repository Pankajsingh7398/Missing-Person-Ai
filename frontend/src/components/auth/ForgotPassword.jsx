import React, { useState } from "react";
import { useSignIn } from "@clerk/clerk-react";

export default function ForgotPassword({ onNavigate }) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Password reset step states
  const [resetting, setResetting] = useState(false);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    if (!email) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setInfoMsg("");

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setResetting(true);
      setInfoMsg("A verification code has been sent to your email.");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.errors?.[0]?.longMessage || err.message || "Failed to initiate password reset.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    if (!code || !newPassword) {
      setErrorMsg("Please enter the verification code and your new password.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters or digits long.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password: newPassword,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      } else {
        setErrorMsg("Failed to reset password. Please verify the code and details.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.errors?.[0]?.longMessage || err.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  if (resetting) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo-badge">AI</div>
          <div className="subtitle">CCTV Intelligence System</div>
          <h2>RESET PASSWORD</h2>
          <p className="desc">Enter the verification code and choose a new password</p>

          {errorMsg && <div className="auth-error-box">{errorMsg}</div>}
          {infoMsg && (
            <div className="auth-error-box" style={{ background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "#88ff88" }}>
              {infoMsg}
            </div>
          )}

          <form className="auth-form" onSubmit={handleResetSubmit}>
            <div className="auth-group">
              <label>Verification Code</label>
              <input
                type="text"
                className="auth-input"
                placeholder="Enter reset code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="auth-group">
              <label>New Password</label>
              <div className="auth-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password →"}
            </button>
          </form>

          <div className="auth-footer">
            Back to{" "}
            <a
              href="#signin"
              className="auth-link"
              onClick={(e) => {
                e.preventDefault();
                onNavigate("signin");
              }}
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo-badge">AI</div>
        <div className="subtitle">CCTV Intelligence System</div>
        <h2>RESET PASSWORD</h2>
        <p className="desc">Enter your email to receive a password reset link</p>

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

          <button type="submit" className="auth-submit-btn" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Reset Link →"}
          </button>
        </form>

        <div className="auth-footer">
          Back to{" "}
          <a
            href="#signin"
            className="auth-link"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("signin");
            }}
          >
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
