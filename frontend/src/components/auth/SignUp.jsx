import React, { useState } from "react";
import { useSignUp } from "@clerk/clerk-react";

export default function SignUp({ onNavigate }) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Verification state
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    if (!name || !email || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      // Split first and last name
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifying(true);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.errors?.[0]?.longMessage || err.message || "Failed to create account.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    if (!code) {
      setErrorMsg("Please enter the verification code.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
      } else {
        console.log(completeSignUp);
        setErrorMsg("Verification incomplete. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.errors?.[0]?.longMessage || err.message || "Invalid verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: window.location.origin,
      });
    } catch (err) {
      console.error(err);
      setErrorMsg(err.errors?.[0]?.longMessage || err.message || "Could not sign up with Google.");
      setIsLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo-badge">AI</div>
          <div className="subtitle">CCTV Intelligence System</div>
          <h2>VERIFY EMAIL</h2>
          <p className="desc">Enter the verification code sent to {email}</p>

          {errorMsg && <div className="auth-error-box">{errorMsg}</div>}

          <form className="auth-form" onSubmit={handleVerify}>
            <div className="auth-group">
              <label>Verification Code</label>
              <input
                type="text"
                className="auth-input"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify Code →"}
            </button>
          </form>

          <div className="auth-footer">
            Did not receive code?{" "}
            <a
              href="#resend"
              className="auth-link"
              onClick={async (e) => {
                e.preventDefault();
                setIsLoading(true);
                setErrorMsg("");
                try {
                  await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
                  alert("Verification code resent.");
                } catch (err) {
                  setErrorMsg(err.errors?.[0]?.longMessage || err.message || "Resend failed.");
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              Resend
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
        <h2>CREATE ACCOUNT</h2>
        <p className="desc">Register to access the investigation dashboard</p>

        {errorMsg && <div className="auth-error-box">{errorMsg}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-group">
            <label>Full Name</label>
            <input
              type="text"
              className="auth-input"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

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
                placeholder="Create a password"
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

          <button type="submit" className="auth-submit-btn" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Sign Up →"}
          </button>
        </form>

        <div className="auth-divider">OR</div>

        <button
          type="button"
          className="auth-oauth-btn"
          onClick={handleGoogleSignUp}
          disabled={isLoading}
        >
          <span style={{ fontSize: "16px" }}>🌐</span> Sign up with Google
        </button>

        <div className="auth-footer">
          Already have an account?{" "}
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
