import { c as reactExports, p as jsxRuntimeExports } from "../server.js";
import { c as cn, B as Button } from "./button-H3GgbSOI.js";
import { S as Subscribable, s as shallowEqualObjects, h as hashKey, g as getDefaultState, n as notifyManager, a as useQueryClient, b as noop, d as shouldThrowError, c as createLucideIcon, R as Route } from "./router-C9ub7rpA.js";
import "node:async_hooks";
import "node:stream";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "node:stream/web";
var MutationObserver = class extends Subscribable {
  #client;
  #currentResult = void 0;
  #currentMutation;
  #mutateOptions;
  constructor(client, options) {
    super();
    this.#client = client;
    this.setOptions(options);
    this.bindMethods();
    this.#updateResult();
  }
  bindMethods() {
    this.mutate = this.mutate.bind(this);
    this.reset = this.reset.bind(this);
  }
  setOptions(options) {
    const prevOptions = this.options;
    this.options = this.#client.defaultMutationOptions(options);
    if (!shallowEqualObjects(this.options, prevOptions)) {
      this.#client.getMutationCache().notify({
        type: "observerOptionsUpdated",
        mutation: this.#currentMutation,
        observer: this
      });
    }
    if (prevOptions?.mutationKey && this.options.mutationKey && hashKey(prevOptions.mutationKey) !== hashKey(this.options.mutationKey)) {
      this.reset();
    } else if (this.#currentMutation?.state.status === "pending") {
      this.#currentMutation.setOptions(this.options);
    }
  }
  onUnsubscribe() {
    if (!this.hasListeners()) {
      this.#currentMutation?.removeObserver(this);
    }
  }
  onMutationUpdate(action) {
    this.#updateResult();
    this.#notify(action);
  }
  getCurrentResult() {
    return this.#currentResult;
  }
  reset() {
    this.#currentMutation?.removeObserver(this);
    this.#currentMutation = void 0;
    this.#updateResult();
    this.#notify();
  }
  mutate(variables, options) {
    this.#mutateOptions = options;
    this.#currentMutation?.removeObserver(this);
    this.#currentMutation = this.#client.getMutationCache().build(this.#client, this.options);
    this.#currentMutation.addObserver(this);
    return this.#currentMutation.execute(variables);
  }
  #updateResult() {
    const state = this.#currentMutation?.state ?? getDefaultState();
    this.#currentResult = {
      ...state,
      isPending: state.status === "pending",
      isSuccess: state.status === "success",
      isError: state.status === "error",
      isIdle: state.status === "idle",
      mutate: this.mutate,
      reset: this.reset
    };
  }
  #notify(action) {
    notifyManager.batch(() => {
      if (this.#mutateOptions && this.hasListeners()) {
        const variables = this.#currentResult.variables;
        const onMutateResult = this.#currentResult.context;
        const context = {
          client: this.#client,
          meta: this.options.meta,
          mutationKey: this.options.mutationKey
        };
        if (action?.type === "success") {
          try {
            this.#mutateOptions.onSuccess?.(
              action.data,
              variables,
              onMutateResult,
              context
            );
          } catch (e) {
            void Promise.reject(e);
          }
          try {
            this.#mutateOptions.onSettled?.(
              action.data,
              null,
              variables,
              onMutateResult,
              context
            );
          } catch (e) {
            void Promise.reject(e);
          }
        } else if (action?.type === "error") {
          try {
            this.#mutateOptions.onError?.(
              action.error,
              variables,
              onMutateResult,
              context
            );
          } catch (e) {
            void Promise.reject(e);
          }
          try {
            this.#mutateOptions.onSettled?.(
              void 0,
              action.error,
              variables,
              onMutateResult,
              context
            );
          } catch (e) {
            void Promise.reject(e);
          }
        }
      }
      this.listeners.forEach((listener) => {
        listener(this.#currentResult);
      });
    });
  }
};
function useMutation(options, queryClient) {
  const client = useQueryClient();
  const [observer] = reactExports.useState(
    () => new MutationObserver(
      client,
      options
    )
  );
  reactExports.useEffect(() => {
    observer.setOptions(options);
  }, [observer, options]);
  const result = reactExports.useSyncExternalStore(
    reactExports.useCallback(
      (onStoreChange) => observer.subscribe(notifyManager.batchCalls(onStoreChange)),
      [observer]
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult()
  );
  const mutate = reactExports.useCallback(
    (variables, mutateOptions) => {
      observer.mutate(variables, mutateOptions).catch(noop);
    },
    [observer]
  );
  if (result.error && shouldThrowError(observer.options.throwOnError, [result.error])) {
    throw result.error;
  }
  return { ...result, mutate, mutateAsync: result.mutate };
}
const __iconNode$1 = [["path", { d: "M21 12a9 9 0 1 1-6.219-8.56", key: "13zald" }]];
const LoaderCircle = createLucideIcon("loader-circle", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",
      key: "1ffxy3"
    }
  ],
  ["path", { d: "m21.854 2.147-10.94 10.939", key: "12cjpa" }]
];
const Send = createLucideIcon("send", __iconNode);
function Card({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-slot": "card",
      className: cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      ),
      ...props
    }
  );
}
function CardHeader({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      "data-slot": "card-header",
      className: cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      ),
      ...props
    }
  );
}
function CardTitle({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-slot": "card-title", className: cn("leading-none font-semibold", className), ...props });
}
function CardContent({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-slot": "card-content", className: cn("px-6", className), ...props });
}
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
function generateMockResponse(userMessage) {
  const responses = {
    adventure: [
      "That adventurous nature often correlates with high openness to experience. Do you find yourself seeking out novel experiences in other ways too?",
      "I'm curious — when things don't go as planned during an adventure, how do you typically react?"
    ],
    challenge: [
      "Interesting. It sounds like you enjoy pushing yourself. How do you usually handle setbacks when pursuing these challenges?",
      "Do you apply that same challenge-seeking approach to your personal and professional goals?"
    ],
    creative: [
      "Creativity is fascinating. How important is it for you to express your creative side in your daily life?",
      "Do you see creativity as something essential to your happiness, or more as an occasional outlet?"
    ],
    relationship: [
      "Relationships are central to who we are. How would your close friends describe you?",
      "Do you find it easy to open up to people, or do you prefer to keep things more private?"
    ],
    work: [
      "Work takes up a significant portion of our lives. What aspects of your work are most fulfilling?",
      "Do you prefer structure and planning, or do you like more flexibility in how you approach tasks?"
    ],
    default: [
      "Tell me more about that. What draws you to this interest?",
      "That's insightful. Do you find that this applies to other areas of your life as well?",
      "I appreciate you sharing that. How would you say this shapes who you are?"
    ]
  };
  const lowerInput = userMessage.toLowerCase();
  if (lowerInput.includes("adventure") || lowerInput.includes("discover") || lowerInput.includes("explore")) {
    return responses.adventure[Math.floor(Math.random() * responses.adventure.length)];
  }
  if (lowerInput.includes("challenge") || lowerInput.includes("difficult") || lowerInput.includes("hard")) {
    return responses.challenge[Math.floor(Math.random() * responses.challenge.length)];
  }
  if (lowerInput.includes("create") || lowerInput.includes("creative") || lowerInput.includes("art")) {
    return responses.creative[Math.floor(Math.random() * responses.creative.length)];
  }
  if (lowerInput.includes("friend") || lowerInput.includes("relation") || lowerInput.includes("people")) {
    return responses.relationship[Math.floor(Math.random() * responses.relationship.length)];
  }
  if (lowerInput.includes("work") || lowerInput.includes("job") || lowerInput.includes("career")) {
    return responses.work[Math.floor(Math.random() * responses.work.length)];
  }
  return responses.default[Math.floor(Math.random() * responses.default.length)];
}
function useTherapistChat(sessionId) {
  const [messages, setMessages] = reactExports.useState([
    {
      id: "msg_init",
      role: "assistant",
      content: "Hi! I'm Nerin, your AI therapist. I'd like to understand you better. Let's start with something simple: What are you currently passionate about?",
      timestamp: new Date(Date.now() - 5e3)
    }
  ]);
  const [traits, setTraits] = reactExports.useState({
    openness: 0.58,
    conscientiousness: 0.42,
    extraversion: 0.55,
    agreeableness: 0.51,
    neuroticism: 0.38,
    opennessPrecision: 58,
    conscientiousnessPrecision: 42,
    extraversionPrecision: 55,
    agreeablenessPrecision: 51,
    neuroticismPrecision: 38
  });
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const { mutate: sendMessageRpc, isPending: isRpcPending } = useSendMessage();
  const sendMessage = reactExports.useCallback(
    async (userMessage) => {
      if (!sessionId || !userMessage) return;
      setIsLoading(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: "user",
          content: userMessage,
          timestamp: /* @__PURE__ */ new Date()
        }
      ]);
      try {
        sendMessageRpc(
          { sessionId, message: userMessage },
          {
            onSuccess: (data) => {
              setTimeout(
                () => {
                  const mockResponse = data.response || generateMockResponse(userMessage);
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `msg-${Date.now()}-response`,
                      role: "assistant",
                      content: mockResponse,
                      timestamp: /* @__PURE__ */ new Date()
                    }
                  ]);
                  if (data.precision) {
                    setTraits({
                      openness: data.precision.openness,
                      conscientiousness: data.precision.conscientiousness,
                      extraversion: data.precision.extraversion,
                      agreeableness: data.precision.agreeableness,
                      neuroticism: data.precision.neuroticism,
                      opennessPrecision: Math.round(data.precision.openness * 100),
                      conscientiousnessPrecision: Math.round(data.precision.conscientiousness * 100),
                      extraversionPrecision: Math.round(data.precision.extraversion * 100),
                      agreeablenessPrecision: Math.round(data.precision.agreeableness * 100),
                      neuroticismPrecision: Math.round(data.precision.neuroticism * 100)
                    });
                  }
                  setIsLoading(false);
                },
                1e3 + Math.random() * 1e3
              );
            },
            onError: (error) => {
              console.error("Failed to send message:", error);
              const mockResponse = generateMockResponse(userMessage);
              setMessages((prev) => [
                ...prev,
                {
                  id: `msg-${Date.now()}-response`,
                  role: "assistant",
                  content: mockResponse,
                  timestamp: /* @__PURE__ */ new Date()
                }
              ]);
              setTraits((prev) => {
                const newOpenness = Math.min(prev.openness + Math.random() * 0.04, 0.95);
                const newConscientiousness = Math.min(prev.conscientiousness + Math.random() * 0.04, 0.95);
                const newExtraversion = Math.min(prev.extraversion + Math.random() * 0.04, 0.95);
                const newAgreeableness = Math.min(prev.agreeableness + Math.random() * 0.04, 0.95);
                const newNeuroticism = Math.min(prev.neuroticism + Math.random() * 0.04, 0.95);
                return {
                  openness: newOpenness,
                  conscientiousness: newConscientiousness,
                  extraversion: newExtraversion,
                  agreeableness: newAgreeableness,
                  neuroticism: newNeuroticism,
                  opennessPrecision: Math.round(newOpenness * 100),
                  conscientiousnessPrecision: Math.round(newConscientiousness * 100),
                  extraversionPrecision: Math.round(newExtraversion * 100),
                  agreeablenessPrecision: Math.round(newAgreeableness * 100),
                  neuroticismPrecision: Math.round(newNeuroticism * 100)
                };
              });
              setIsLoading(false);
            }
          }
        );
      } catch (error) {
        console.error("Failed to send message:", error);
        setIsLoading(false);
      }
    },
    [sessionId, sendMessageRpc]
  );
  return {
    messages,
    traits,
    isLoading: isLoading || isRpcPending,
    isCompleted: false,
    sendMessage
  };
}
const traitLabels = {
  opennessPrecision: "Openness",
  conscientiousnessPrecision: "Conscientiousness",
  extraversionPrecision: "Extraversion",
  agreeablenessPrecision: "Agreeableness",
  neuroticismPrecision: "Neuroticism"
};
function TherapistChat({ sessionId }) {
  const [inputValue, setInputValue] = reactExports.useState("");
  const messagesEndRef = reactExports.useRef(null);
  const { messages, traits, isLoading, isCompleted, sendMessage } = useTherapistChat(sessionId);
  reactExports.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  });
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    await sendMessage(inputValue);
    setInputValue("");
  };
  const handleStartAssessment = async () => {
    if (!isLoading) {
      await sendMessage();
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-800/50 border-b border-slate-700 px-6 py-4 shadow-sm backdrop-blur-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent", children: "Big Five Personality Assessment" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-gray-400 mt-1", children: [
        "Session ID: ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-slate-700 px-2 py-1 rounded text-gray-300", children: sessionId })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-hidden flex gap-4 p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto space-y-4 mb-4", children: [
          messages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "w-full max-w-md bg-slate-800/50 border-slate-700", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-center text-white", children: "Welcome to Personality Assessment" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-300 text-center", children: "The AI therapist will ask you questions to evaluate your personality across five key dimensions. Ready to begin?" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  onClick: handleStartAssessment,
                  disabled: isLoading,
                  className: "w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600",
                  children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
                    "Starting..."
                  ] }) : "Start Assessment"
                }
              )
            ] })
          ] }) }) : messages.map((msg) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: `flex ${msg.role === "user" ? "justify-end" : "justify-start"}`,
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: `max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.role === "user" ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white" : "bg-slate-700/50 border border-slate-600 text-gray-100"}`,
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: msg.content }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-xs mt-1 ${msg.role === "user" ? "text-blue-100" : "text-gray-400"}`, children: msg.timestamp?.toLocaleTimeString() || new Date(msg.createdAt || "").toLocaleTimeString() })
                  ]
                }
              )
            },
            msg.id
          )),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: messagesEndRef })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: inputValue,
              onChange: (e) => setInputValue(e.target.value),
              onKeyDown: handleKeyDown,
              placeholder: "Type your response here...",
              disabled: isLoading || isCompleted,
              className: "flex-1 px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: handleSendMessage,
              disabled: !inputValue.trim() || isLoading || isCompleted,
              size: "sm",
              className: "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600",
              children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" })
            }
          )
        ] }) })
      ] }),
      traits && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-80 flex flex-col", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-slate-800/50 border-slate-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg text-white", children: "Current Scores" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
          Object.entries(traitLabels).map(([key, label]) => {
            const score = traits[key];
            const percentage = Math.round(score * 100);
            const color = percentage >= 90 ? "bg-green-500" : percentage >= 70 ? "bg-yellow-500" : "bg-orange-500";
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between mb-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-gray-300", children: label }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-bold text-gray-100", children: [
                  percentage,
                  "%"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full bg-slate-700 rounded-full h-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: `h-2 rounded-full transition-all ${color}`,
                  style: { width: `${percentage}%` }
                }
              ) })
            ] }, key);
          }),
          isCompleted
        ] })
      ] }) })
    ] })
  ] });
}
function RouteComponent() {
  const {
    sessionId
  } = Route.useSearch();
  if (!sessionId) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-screen flex items-center justify-center bg-gray-50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-600", children: "Creating assessment session..." })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(TherapistChat, { sessionId });
}
export {
  RouteComponent as component
};
