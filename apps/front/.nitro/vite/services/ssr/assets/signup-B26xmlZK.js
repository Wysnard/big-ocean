import { c as reactExports, p as jsxRuntimeExports } from "../server.js";
import { u as useAuth } from "./use-auth-Dz7_Rgtt.js";
import "node:async_hooks";
import "node:stream";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "node:stream/web";
function SignupForm() {
  const { signUp } = useAuth();
  const [name, setName] = reactExports.useState("");
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [confirmPassword, setConfirmPassword] = reactExports.useState("");
  const [error, setError] = reactExports.useState(null);
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 12) {
      setError("Password must be at least 12 characters");
      return;
    }
    setIsLoading(true);
    try {
      await signUp.email(email, password, name);
      window.location.href = "/dashboard";
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("already exists")) {
        setError("An account with this email already exists");
      } else {
        setError(errorMessage || "Sign up failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4 max-w-md mx-auto p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold mb-6", children: "Create Account" }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-red-50 text-red-700 p-3 rounded border border-red-200", children: error }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "name", className: "block text-sm font-medium mb-1", children: "Name" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          id: "name",
          type: "text",
          value: name,
          onChange: (e) => setName(e.target.value),
          className: "w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
          placeholder: "Your name"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "email", className: "block text-sm font-medium mb-1", children: "Email" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          id: "email",
          type: "email",
          value: email,
          onChange: (e) => setEmail(e.target.value),
          required: true,
          className: "w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
          placeholder: "you@example.com"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "password", className: "block text-sm font-medium mb-1", children: "Password" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          id: "password",
          type: "password",
          value: password,
          onChange: (e) => setPassword(e.target.value),
          required: true,
          minLength: 12,
          className: "w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
          placeholder: "At least 12 characters"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Minimum 12 characters required (NIST 2025)" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "confirmPassword", className: "block text-sm font-medium mb-1", children: "Confirm Password" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          id: "confirmPassword",
          type: "password",
          value: confirmPassword,
          onChange: (e) => setConfirmPassword(e.target.value),
          required: true,
          minLength: 12,
          className: "w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500",
          placeholder: "Confirm password"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "submit",
        disabled: isLoading,
        className: "w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed",
        children: isLoading ? "Creating account..." : "Sign Up"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-center text-gray-600", children: [
      "Already have an account?",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "/login", className: "text-blue-600 hover:underline", children: "Sign in" })
    ] })
  ] });
}
function SignupPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SignupForm, {}) }) });
}
export {
  SignupPage as component
};
