import { p as jsxRuntimeExports } from "../server.js";
import { u as useAuth, a as useRequireAuth } from "./use-auth-Dz7_Rgtt.js";
import "node:async_hooks";
import "node:stream";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "node:stream/web";
function UserMenu() {
  const { user, isAuthenticated, isPending, signOut } = useAuth();
  if (isPending) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-pulse bg-gray-200 h-8 w-24 rounded" });
  }
  if (!isAuthenticated || !user) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "/login", className: "px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900", children: "Sign In" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "/signup",
          className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700",
          children: "Sign Up"
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-gray-900", children: user.name || "User" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-500", children: user.email })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: () => signOut(),
        className: "px-3 py-1 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50",
        children: "Sign Out"
      }
    )
  ] });
}
function DashboardPage() {
  const {
    user,
    isPending
  } = useRequireAuth("/login");
  if (isPending) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-gray-600", children: "Loading..." })
    ] }) });
  }
  if (!user) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-gray-50", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "bg-white shadow", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Dashboard" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(UserMenu, {})
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-xl font-semibold mb-4", children: [
        "Welcome, ",
        user.name,
        "!"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-gray-600", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Email:" }),
          " ",
          user.email
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-gray-600", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "User ID:" }),
          " ",
          user.id
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 p-4 bg-blue-50 rounded border border-blue-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-blue-800", children: "✓ You're successfully authenticated with Better Auth" }) })
    ] }) })
  ] });
}
export {
  DashboardPage as component
};
