import { c as reactExports, q as jsxRuntimeExports } from "../server.js";
import { c as createLucideIcon, e as Route, L as Link, C as ChevronDown } from "./router-BKS0gMzo.js";
import { B as Button } from "./button-eboxan6j.js";
import { c as useGetPublicProfile, E as Eye, C as Check, b as Copy } from "./use-profile-B0Q-nlNa.js";
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
const __iconNode$2 = [["path", { d: "m18 15-6-6-6 6", key: "153udz" }]];
const ChevronUp = createLucideIcon("chevron-up", __iconNode$2);
const __iconNode$1 = [
  ["rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2", key: "1w4ew1" }],
  ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4", key: "fwvmzm" }]
];
const Lock = createLucideIcon("lock", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
      key: "oel41y"
    }
  ],
  ["path", { d: "M12 8v4", key: "1got3b" }],
  ["path", { d: "M12 16h.01", key: "1drbdi" }]
];
const ShieldAlert = createLucideIcon("shield-alert", __iconNode);
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
const LEVEL_LABELS = {
  H: {
    label: "High",
    width: "85%"
  },
  M: {
    label: "Mid",
    width: "50%"
  },
  L: {
    label: "Low",
    width: "15%"
  }
};
const TRAIT_FACETS = {
  openness: {
    facets: ["imagination", "artistic_interests", "emotionality", "adventurousness", "intellect", "liberalism"],
    displayNames: {
      imagination: "Imagination",
      artistic_interests: "Artistic Interests",
      emotionality: "Emotionality",
      adventurousness: "Adventurousness",
      intellect: "Intellect",
      liberalism: "Liberalism"
    }
  },
  conscientiousness: {
    facets: ["self_efficacy", "orderliness", "dutifulness", "achievement_striving", "self_discipline", "cautiousness"],
    displayNames: {
      self_efficacy: "Self-Efficacy",
      orderliness: "Orderliness",
      dutifulness: "Dutifulness",
      achievement_striving: "Achievement Striving",
      self_discipline: "Self-Discipline",
      cautiousness: "Cautiousness"
    }
  },
  extraversion: {
    facets: ["friendliness", "gregariousness", "assertiveness", "activity_level", "excitement_seeking", "cheerfulness"],
    displayNames: {
      friendliness: "Friendliness",
      gregariousness: "Gregariousness",
      assertiveness: "Assertiveness",
      activity_level: "Activity Level",
      excitement_seeking: "Excitement Seeking",
      cheerfulness: "Cheerfulness"
    }
  },
  agreeableness: {
    facets: ["trust", "morality", "altruism", "cooperation", "modesty", "sympathy"],
    displayNames: {
      trust: "Trust",
      morality: "Morality",
      altruism: "Altruism",
      cooperation: "Cooperation",
      modesty: "Modesty",
      sympathy: "Sympathy"
    }
  },
  neuroticism: {
    facets: ["anxiety", "anger", "depression", "self_consciousness", "immoderation", "vulnerability"],
    displayNames: {
      anxiety: "Anxiety",
      anger: "Anger",
      depression: "Depression",
      self_consciousness: "Self-Consciousness",
      immoderation: "Immoderation",
      vulnerability: "Vulnerability"
    }
  }
};
function ProfilePage() {
  const {
    publicProfileId
  } = Route.useParams();
  const {
    data: profile,
    isLoading,
    error
  } = useGetPublicProfile(publicProfileId);
  const [copied, setCopied] = reactExports.useState(false);
  const [expandedTrait, setExpandedTrait] = reactExports.useState(null);
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = window.location.href;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    }
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400", children: "Loading profile..." })
    ] }) });
  }
  if (error) {
    const errorMessage = error.message;
    const isPrivate = errorMessage.includes("private");
    const isNotFound = errorMessage.includes("not found") || errorMessage.includes("404");
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center max-w-md", children: [
      isPrivate ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "w-16 h-16 text-slate-500 mx-auto mb-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-white mb-2", children: "This Profile is Private" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 mb-6", children: "The owner has set this profile to private. It is not publicly viewable." })
      ] }) : isNotFound ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "w-16 h-16 text-slate-500 mx-auto mb-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-white mb-2", children: "Profile Not Found" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 mb-6", children: "This profile doesn't exist or may have been removed." })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "w-16 h-16 text-red-400 mx-auto mb-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold text-white mb-2", children: "Something Went Wrong" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 mb-6", children: errorMessage })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600", children: "Go Home" }) })
    ] }) });
  }
  if (!profile) return null;
  const traitOrder = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4 md:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-slate-700 overflow-hidden mb-8", style: {
      background: `linear-gradient(135deg, ${profile.color}22, ${profile.color}08)`
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center", style: {
        backgroundColor: `${profile.color}33`
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Waves, { className: "w-10 h-10", style: {
        color: profile.color
      } }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl md:text-4xl font-bold text-white mb-2", children: profile.archetypeName }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-mono text-slate-400 mb-4", children: [
        "OCEAN Code: ",
        profile.oceanCode
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-300 leading-relaxed max-w-lg mx-auto", children: profile.description })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-white mb-6", children: "Trait Summary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-5", children: traitOrder.map((trait) => {
        const config = TRAIT_CONFIG[trait];
        const level = profile.traitSummary[trait] || "M";
        const levelInfo = LEVEL_LABELS[level] || LEVEL_LABELS.M;
        const isExpanded = expandedTrait === trait;
        const traitFacets = TRAIT_FACETS[trait];
        if (!config) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-slate-700/50 rounded-lg p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setExpandedTrait(isExpanded ? null : trait), className: "w-full text-left", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center gap-2 ${config.color}`, children: [
                config.icon,
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium text-gray-300", children: config.label }),
                isExpanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "w-4 h-4 text-slate-400" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-4 h-4 text-slate-400" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-gray-100", children: levelInfo.label })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full bg-slate-700 rounded-full h-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-2.5 rounded-full transition-all duration-500 ${config.barColor}`, style: {
              width: levelInfo.width
            } }) })
          ] }),
          isExpanded && traitFacets && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 pt-4 border-t border-slate-700/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400 mb-3 uppercase tracking-wider", children: "Facet Breakdown" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: traitFacets.facets.map((facetKey) => {
              const facetData = profile.facets?.[facetKey];
              if (!facetData) return null;
              const percentage = Math.round(facetData.score / 20 * 100);
              const displayName = traitFacets.displayNames[facetKey] || facetKey;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-400", children: displayName }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-300 font-mono", children: [
                    facetData.score,
                    "/20"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full bg-slate-700/50 rounded-full h-1.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-1.5 rounded-full ${config.barColor} opacity-70`, style: {
                  width: `${percentage}%`
                } }) })
              ] }, facetKey);
            }) })
          ] })
        ] }, trait);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "w-5 h-5 text-slate-400" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-white", children: "Share This Profile" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleCopyLink, variant: "outline", className: "border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white", children: copied ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-4 h-4 mr-2 text-green-400" }),
        "Copied!"
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-4 h-4 mr-2" }),
        "Copy Link"
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-gray-400 mb-4", children: "Want to discover your own personality archetype?" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/chat", search: {
        sessionId: void 0
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-8", children: "Take the Assessment" }) })
    ] })
  ] }) });
}
export {
  ProfilePage as component
};
