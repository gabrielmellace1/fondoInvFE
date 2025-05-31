import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Label from "../form/Label";
import Input from "../form/input/InputField";

export default function ResetPasswordForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const token = params.get("token");

  // State for resetting password
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  // Handle reset password
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");
    if (password !== repeatPassword) {
      setResetError("Passwords do not match.");
      return;
    }
    setResetLoading(true);
    try {
      const res = await fetch("http://localhost:3000/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (data.success) {
        setResetSuccess("Password reset successfully. You can now sign in.");
        setTimeout(() => navigate("/signin"), 2000);
      } else {
        setResetError(data.message || "Failed to reset password.");
      }
    } catch {
      setResetError("Network error. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  // Render
  return (
    <div className="flex flex-col flex-1 w-full lg:w-1/2">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <svg
            className="stroke-current"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M12.7083 5L7.5 10.2083L12.7083 15.4167"
              stroke=""
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Set a New Password
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your new password below.
          </p>
        </div>
        <form onSubmit={handleReset}>
          <div className="space-y-5">
        <div>
              <Label>
                New Password<span className="text-error-500">*</span>
              </Label>
              <Input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your new password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
              <div>
                <Label>
                Repeat Password<span className="text-error-500">*</span>
                </Label>
                <Input
                type="password"
                id="repeatPassword"
                name="repeatPassword"
                placeholder="Repeat your new password"
                value={repeatPassword}
                onChange={e => setRepeatPassword(e.target.value)}
                />
              </div>
            {resetError && <div className="text-error-500 text-sm text-center">{resetError}</div>}
            {resetSuccess && <div className="text-green-600 text-sm text-center">{resetSuccess}</div>}
              <div>
              <button
                className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
                type="submit"
                disabled={resetLoading}
              >
                {resetLoading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </div>
          </form>
          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Wait, I remember my password...
              <Link
                to="/"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Click here
              </Link>
            </p>
        </div>
      </div>
    </div>
  );
}
