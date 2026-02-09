import { c as reactExports, q as jsxRuntimeExports } from "../server.js";
import { u as useAuth } from "./use-auth-DbltyjcL.js";
import "node:async_hooks";
import "node:stream";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "node:stream/web";
function LoginForm() {
  const { signIn, isPending } = useAuth();
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [error, setError] = reactExports.useState(null);
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await signIn.email(email, password);
      window.location.href = "/dashboard";
    } catch (err) {
      setError((err instanceof Error ? err.message : String(err)) || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };
  if (isPending) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "Checking authentication..." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-4 max-w-md mx-auto p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold mb-6", children: "Sign In" }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-red-50 text-red-700 p-3 rounded border border-red-200", children: error }),
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
          placeholder: "••••••••••••"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "submit",
        disabled: isLoading,
        className: "w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed",
        children: isLoading ? "Signing in..." : "Sign In"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-center text-gray-600", children: [
      "Don't have an account?",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "/signup", className: "text-blue-600 hover:underline", children: "Sign up" })
    ] })
  ] });
}
function LoginPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoginForm, {}) }) });
}
export {
  LoginPage as component
};
