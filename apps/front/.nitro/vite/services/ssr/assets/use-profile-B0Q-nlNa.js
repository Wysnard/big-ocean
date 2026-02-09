import { c as createLucideIcon } from "./router-BKS0gMzo.js";
import { a as useMutation, u as useQuery } from "./useMutation-M0q3KDvU.js";
const __iconNode$2 = [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]];
const Check = createLucideIcon("check", __iconNode$2);
const __iconNode$1 = [
  ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "17jyea" }],
  ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "zix9uf" }]
];
const Copy = createLucideIcon("copy", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
      key: "1nclc0"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
];
const Eye = createLucideIcon("eye", __iconNode);
const API_URL = "http://localhost:4000";
async function fetchApi(endpoint, options) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers
    },
    credentials: "include"
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}
function useShareProfile() {
  return useMutation({
    mutationKey: ["profile", "share"],
    mutationFn: async (sessionId) => {
      return fetchApi("/api/profile/share", {
        method: "POST",
        body: JSON.stringify({ sessionId })
      });
    }
  });
}
function useGetPublicProfile(publicProfileId, enabled = true) {
  return useQuery({
    queryKey: ["profile", "public", publicProfileId],
    queryFn: async () => {
      return fetchApi(`/api/profile/${publicProfileId}`);
    },
    enabled: enabled && !!publicProfileId,
    retry: false
  });
}
function useToggleVisibility() {
  return useMutation({
    mutationKey: ["profile", "toggleVisibility"],
    mutationFn: async (input) => {
      return fetchApi(`/api/profile/${input.publicProfileId}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ isPublic: input.isPublic })
      });
    }
  });
}
export {
  Check as C,
  Eye as E,
  useToggleVisibility as a,
  Copy as b,
  useGetPublicProfile as c,
  useShareProfile as u
};
