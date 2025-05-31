import { useState } from "react";
import { Link } from "react-router-dom";
import Label from "../form/Label";
import Input from "../form/input/InputField";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError("");
    setRequestSuccess("");
    setRequestLoading(true);
    try {
      const res = await fetch("http://localhost:3000/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setRequestSuccess("A reset link has been sent to your email if it exists in our system.");
      } else {
        setRequestError(data.error || "Failed to send reset link.");
      }
    } catch {
      setRequestError("Network error. Please try again.");
    } finally {
      setRequestLoading(false);
    }
  };

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
            Forgot Your Password?
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter the email address linked to your account, and we'll send you a link to reset your password.
          </p>
        </div>
        <form onSubmit={handleRequest}>
          <div className="space-y-5">
            <div>
              <Label>
                Email<span className="text-error-500">*</span>
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            {requestError && <div className="text-error-500 text-sm text-center">{requestError}</div>}
            {requestSuccess && <div className="text-green-600 text-sm text-center">{requestSuccess}</div>}
            <div>
              <button
                className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
                type="submit"
                disabled={requestLoading}
              >
                {requestLoading ? "Sending..." : "Send Reset Link"}
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