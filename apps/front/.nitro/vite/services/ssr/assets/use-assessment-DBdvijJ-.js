import { u as useQuery, a as useMutation } from "./useMutation-M0q3KDvU.js";
const API_URL = "http://localhost:4000";
async function fetchApi(endpoint, options) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers
    },
    credentials: "include"
    // Include cookies for auth
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}
function useSendMessage() {
  return useMutation({
    mutationKey: ["assessment", "sendMessage"],
    mutationFn: async (input) => {
      return fetchApi("/api/assessment/message", {
        method: "POST",
        body: JSON.stringify(input)
      });
    }
  });
}
function useGetResults(sessionId, enabled = true) {
  return useQuery({
    queryKey: ["assessment", "results", sessionId],
    queryFn: async () => {
      return fetchApi(`/api/assessment/${sessionId}/results`);
    },
    enabled: enabled && !!sessionId
  });
}
function useResumeSession(sessionId, enabled = true) {
  return useQuery({
    queryKey: ["assessment", "session", sessionId],
    queryFn: async () => {
      return fetchApi(`/api/assessment/${sessionId}/resume`);
    },
    enabled: enabled && !!sessionId
  });
}
export {
  useSendMessage as a,
  useResumeSession as b,
  useGetResults as u
};
