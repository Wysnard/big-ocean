import { c as reactExports, q as jsxRuntimeExports } from "../server.js";
import { c as createLucideIcon, R as Route, u as useNavigate } from "./router-BKS0gMzo.js";
import { B as Button } from "./button-eboxan6j.js";
import { u as useGetResults } from "./use-assessment-DBdvijJ-.js";
import { u as useShareProfile, a as useToggleVisibility, C as Check, b as Copy, E as Eye } from "./use-profile-B0Q-nlNa.js";
import { L as LoaderCircle } from "./loader-circle-DAbNCM7K.js";
import { W as Waves, T as TrendingUp, H as Handshake, a as Heart, Z as Zap, L as Lightbulb } from "./zap-CxWIexXM.js";
import "node:async_hooks";
import "node:stream";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "node:stream/web";
import "./utils-QXBWQHlM.js";
import "./useMutation-M0q3KDvU.js";
const __iconNode$2 = [
  [
    "path",
    {
      d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",
      key: "ct8e1f"
    }
  ],
  ["path", { d: "M14.084 14.158a3 3 0 0 1-4.242-4.242", key: "151rxh" }],
  [
    "path",
    {
      d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",
      key: "13bj9a"
    }
  ],
  ["path", { d: "m2 2 20 20", key: "1ooewy" }]
];
const EyeOff = createLucideIcon("eye-off", __iconNode$2);
const __iconNode$1 = [
  [
    "path",
    {
      d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",
      key: "1sd12s"
    }
  ]
];
const MessageCircle = createLucideIcon("message-circle", __iconNode$1);
const __iconNode = [
  ["circle", { cx: "18", cy: "5", r: "3", key: "gq8acd" }],
  ["circle", { cx: "6", cy: "12", r: "3", key: "w7nqdw" }],
  ["circle", { cx: "18", cy: "19", r: "3", key: "1xt0gg" }],
  ["line", { x1: "8.59", x2: "15.42", y1: "13.51", y2: "17.49", key: "47mynk" }],
  ["line", { x1: "15.41", x2: "8.59", y1: "6.51", y2: "10.49", key: "1n3mei" }]
];
const Share2 = createLucideIcon("share-2", __iconNode);
const TRAIT_CONFIG = {
  openness: {
    label: "Openness",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Lightbulb, { className: "w-5 h-5" }),
    color: "text-amber-400",
    barColor: "bg-amber-400"
  },
  conscientiousness: {
    label: "Conscientiousness",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-5 h-5" }),
    color: "text-blue-400",
    barColor: "bg-blue-400"
  },
  extraversion: {
    label: "Extraversion",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Heart, { className: "w-5 h-5" }),
    color: "text-rose-400",
    barColor: "bg-rose-400"
  },
  agreeableness: {
    label: "Agreeableness",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Handshake, { className: "w-5 h-5" }),
    color: "text-green-400",
    barColor: "bg-green-400"
  },
  neuroticism: {
    label: "Neuroticism",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "w-5 h-5" }),
    color: "text-purple-400",
    barColor: "bg-purple-400"
  }
};
function ResultsPage() {
  const {
    sessionId
  } = Route.useSearch();
  const navigate = useNavigate();
  const {
    data: results,
    isLoading,
    error
  } = useGetResults(sessionId);
  const shareProfile = useShareProfile();
  const toggleVisibility = useToggleVisibility();
  const [shareState, setShareState] = reactExports.useState(null);
  const [copied, setCopied] = reactExports.useState(false);
  const [shareError, setShareError] = reactExports.useState(null);
  const handleShare = async () => {
    setShareError(null);
    try {
      const result = await shareProfile.mutateAsync(sessionId);
      setShareState(result);
    } catch (err) {
      setShareError(err instanceof Error ? err.message : "Failed to create shareable profile");
    }
  };
  const handleCopyLink = async () => {
    if (!shareState) return;
    try {
      await navigator.clipboard.writeText(shareState.shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = shareState.shareableUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    }
  };
  const handleToggleVisibility = async () => {
    if (!shareState) return;
    try {
      const result = await toggleVisibility.mutateAsync({
        publicProfileId: shareState.publicProfileId,
        isPublic: !shareState.isPublic
      });
      setShareState((prev) => prev ? {
        ...prev,
        isPublic: result.isPublic
      } : null);
    } catch {
    }
  };
  if (!sessionId) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-white mb-4", children: "No Session Found" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 mb-6", children: "Start an assessment to see your results." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => navigate({
        to: "/chat",
        search: {
          sessionId: void 0
        }
      }), className: "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600", children: "Start Assessment" })
    ] }) });
  }
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400", children: "Calculating your personality profile..." })
    ] }) });
  }
  if (error || !results) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-white mb-4", children: "Could Not Load Results" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 mb-6", children: error?.message || "Your assessment may not be complete yet." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => navigate({
        to: "/chat",
        search: {
          sessionId
        }
      }), className: "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "w-4 h-4 mr-2" }),
        "Continue Assessment"
      ] })
    ] }) });
  }
  const traitOrder = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"];
  const maxTraitScore = 120;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4 md:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-blue-500/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Waves, { className: "w-10 h-10 text-blue-400" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-400 uppercase tracking-wider mb-2", children: "Your Personality Archetype" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl md:text-4xl font-bold text-white mb-2", children: results.archetypeName }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-mono text-slate-400", children: [
        "OCEAN Code: ",
        results.oceanCode
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-white mb-6", children: "Your Trait Scores" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-5", children: traitOrder.map((trait) => {
        const config = TRAIT_CONFIG[trait];
        const score = results.traits[trait];
        const percentage = Math.round(score / maxTraitScore * 100);
        if (!config) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center gap-2 ${config.color}`, children: [
              config.icon,
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-gray-300", children: config.label })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-semibold text-gray-100", children: [
              percentage,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full bg-slate-700 rounded-full h-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-2.5 rounded-full transition-all duration-500 ${config.barColor}`, style: {
            width: `${percentage}%`
          } }) })
        ] }, trait);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "w-5 h-5 text-slate-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-white", children: "Share Your Profile" })
      ] }),
      !shareState ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 text-sm mb-4", children: "Generate a shareable link so others can see your personality archetype." }),
        shareError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-400 text-sm mb-4", children: shareError }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleShare, disabled: shareProfile.isPending, className: "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600", children: shareProfile.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 mr-2 animate-spin" }),
          "Generating..."
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "w-4 h-4 mr-2" }),
          "Generate Shareable Link"
        ] }) })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 bg-slate-900/50 rounded-lg p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-sm text-blue-400 flex-1 truncate", children: shareState.shareableUrl }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleCopyLink, size: "sm", variant: "outline", className: "border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white shrink-0", children: copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-4 h-4 text-green-400" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-4 h-4" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            shareState.isPublic ? /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-4 h-4 text-green-400" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "w-4 h-4 text-slate-400" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-gray-300", children: shareState.isPublic ? "Profile is public" : "Profile is private" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleToggleVisibility, size: "sm", variant: "outline", disabled: toggleVisibility.isPending, className: "border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white", children: toggleVisibility.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : shareState.isPublic ? "Make Private" : "Make Public" })
        ] }),
        !shareState.isPublic && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: "Your profile link has been created but is private. Toggle to public so others can view it." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-3 justify-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => navigate({
        to: "/chat",
        search: {
          sessionId
        }
      }), variant: "outline", className: "border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "w-4 h-4 mr-2" }),
        "Continue Chat"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => navigate({
        to: "/chat",
        search: {
          sessionId: void 0
        }
      }), className: "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600", children: "Start New Assessment" })
    ] })
  ] }) });
}
export {
  ResultsPage as component
};
