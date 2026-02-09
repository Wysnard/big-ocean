import { q as jsxRuntimeExports, c as reactExports } from "../server.js";
import { d as Route, L as Link } from "./router-BKS0gMzo.js";
import { c as cn } from "./utils-QXBWQHlM.js";
import { u as useGetResults } from "./use-assessment-DBdvijJ-.js";
import "node:async_hooks";
import "node:stream";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "node:stream/web";
import "./useMutation-M0q3KDvU.js";
function ArchetypeCard({
  archetypeName,
  oceanCode4,
  oceanCode5,
  description,
  color,
  isCurated,
  overallConfidence,
  className
}) {
  const clampedConfidence = Math.min(Math.max(overallConfidence, 0), 100);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "article",
    {
      "aria-label": `Archetype: ${archetypeName}`,
      "data-testid": "archetype-card",
      className: cn(
        "relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/80 p-6 md:p-8",
        className
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: cn("absolute inset-x-0 top-0 h-1.5", isCurated ? "opacity-100" : "opacity-60"),
            style: { backgroundColor: color },
            "data-testid": "archetype-accent"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-col gap-4 md:flex-row md:items-start md:justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "h2",
              {
                className: "text-2xl font-bold tracking-tight text-white md:text-3xl",
                "data-testid": "archetype-name",
                children: archetypeName
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: "rounded-md bg-slate-700/60 px-2.5 py-1 font-mono text-sm font-semibold text-slate-200",
                  "data-testid": "ocean-code-4",
                  children: oceanCode4
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs text-slate-400", "data-testid": "ocean-code-5", children: oceanCode5 })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex items-center gap-2 rounded-lg bg-slate-700/40 px-3 py-2",
              "data-testid": "confidence-indicator",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 rounded-full border-2 border-slate-600 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-slate-200", children: clampedConfidence }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-slate-400", children: "% confidence" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            className: "mt-4 text-sm leading-relaxed text-slate-300 md:text-base",
            "data-testid": "archetype-description",
            children: description
          }
        ),
        isCurated && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: "mt-4 inline-block rounded-full bg-slate-700/50 px-3 py-1 text-xs text-slate-400",
            "data-testid": "curated-badge",
            children: "Curated archetype"
          }
        )
      ]
    }
  );
}
const MAX_FACET_SCORE = 20;
const HIGH_SCORE_THRESHOLD = 15;
const LOW_CONFIDENCE_THRESHOLD$1 = 30;
function FacetBreakdown({
  traitName,
  facets,
  traitScore,
  id,
  className
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "section",
    {
      id,
      "aria-label": `${traitName} facet breakdown`,
      "data-testid": `facet-breakdown-${traitName}`,
      className: cn(
        "overflow-hidden rounded-b-xl border border-t-0 border-slate-700/50 bg-slate-850/40 transition-all duration-300",
        className
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-slate-700/30 px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-400", "data-testid": "facet-sum-label", children: [
          "6 facets sum to",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-slate-300", children: traitName.charAt(0).toUpperCase() + traitName.slice(1) }),
          " ",
          "trait score (",
          traitScore,
          "/120)"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-slate-700/20 px-4", "data-testid": "facet-list", children: facets.map((facet) => {
          const isHighScore = facet.score >= HIGH_SCORE_THRESHOLD;
          const isLowConfidence = facet.confidence < LOW_CONFIDENCE_THRESHOLD$1;
          const scorePercent = Math.round(
            Math.min(Math.max(facet.score, 0), MAX_FACET_SCORE) / MAX_FACET_SCORE * 100
          );
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "li",
            {
              "aria-label": `${facet.name}: ${facet.score} out of ${MAX_FACET_SCORE}, ${facet.confidence}% confidence`,
              "data-testid": `facet-item-${facet.name}`,
              className: cn("py-3", isLowConfidence && "opacity-60"),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: cn(
                          "text-sm truncate",
                          isHighScore ? "font-semibold text-white" : "text-slate-300"
                        ),
                        children: facet.name
                      }
                    ),
                    isHighScore && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: "shrink-0 text-xs text-amber-400",
                        "aria-hidden": "true",
                        "data-testid": `facet-highlight-${facet.name}`,
                        children: "★"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 shrink-0", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-medium text-slate-300", children: [
                      facet.score,
                      "/",
                      MAX_FACET_SCORE
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "span",
                      {
                        className: cn("text-xs", isLowConfidence ? "text-red-400" : "text-slate-500"),
                        "data-testid": `facet-confidence-${facet.name}`,
                        children: [
                          facet.confidence,
                          "%"
                        ]
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: cn(
                      "h-1.5 w-full overflow-hidden rounded-full bg-slate-700/40",
                      isLowConfidence && "border border-dashed border-slate-600/40"
                    ),
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: cn(
                          "h-full rounded-full transition-all duration-300",
                          isHighScore ? "bg-amber-400/80" : "bg-slate-500/60"
                        ),
                        style: { width: `${scorePercent}%` },
                        "data-testid": `facet-fill-${facet.name}`
                      }
                    )
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    disabled: true,
                    className: "mt-1.5 text-xs text-slate-500 cursor-not-allowed",
                    "data-testid": `facet-evidence-btn-${facet.name}`,
                    children: "View Evidence"
                  }
                )
              ]
            },
            facet.name
          );
        }) })
      ]
    }
  );
}
const LEVEL_LABELS = {
  H: "High",
  M: "Mid",
  L: "Low"
};
const MAX_TRAIT_SCORE = 120;
function TraitBar({
  traitName,
  score,
  level,
  confidence,
  color,
  isExpanded,
  onToggle,
  controlsId,
  className
}) {
  const clampedScore = Math.min(Math.max(score, 0), MAX_TRAIT_SCORE);
  const scorePercent = Math.round(clampedScore / MAX_TRAIT_SCORE * 100);
  const clampedConfidence = Math.min(Math.max(confidence, 0), 100);
  const displayName = traitName.charAt(0).toUpperCase() + traitName.slice(1);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      "aria-expanded": isExpanded,
      "aria-controls": controlsId,
      onClick: onToggle,
      "data-testid": `trait-bar-${traitName}`,
      className: cn(
        "w-full rounded-xl border border-slate-700/50 bg-slate-800/60 p-4 text-left transition-colors hover:bg-slate-800/80",
        isExpanded && "border-slate-600/60",
        className
      ),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "h-3 w-3 shrink-0 rounded-full",
                style: { backgroundColor: color },
                "data-testid": `trait-color-${traitName}`
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold text-white truncate", children: displayName }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: cn(
                  "shrink-0 rounded-md px-2 py-0.5 text-xs font-medium",
                  level === "H" && "bg-emerald-900/40 text-emerald-300",
                  level === "M" && "bg-amber-900/40 text-amber-300",
                  level === "L" && "bg-slate-700/60 text-slate-300"
                ),
                "data-testid": `trait-level-${traitName}`,
                children: LEVEL_LABELS[level]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-slate-400", "data-testid": `trait-confidence-${traitName}`, children: [
              clampedConfidence,
              "%"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "svg",
              {
                className: cn(
                  "h-4 w-4 text-slate-400 transition-transform duration-200",
                  isExpanded && "rotate-180"
                ),
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                strokeWidth: 2,
                "aria-hidden": "true",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-7 7-7-7" })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between mb-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-slate-500", children: [
            clampedScore,
            " / ",
            MAX_TRAIT_SCORE
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "h-2 w-full overflow-hidden rounded-full bg-slate-700/60",
              "data-testid": `trait-track-${traitName}`,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "h-full rounded-full transition-all duration-500 ease-out",
                  style: {
                    width: `${scorePercent}%`,
                    backgroundColor: color,
                    opacity: clampedConfidence < 30 ? 0.5 : 1
                  },
                  "data-testid": `trait-fill-${traitName}`
                }
              )
            }
          )
        ] })
      ]
    }
  );
}
const TRAIT_COLORS = {
  openness: "#6B5CE7",
  conscientiousness: "#E87B35",
  extraversion: "#E74C8B",
  agreeableness: "#4CAF6E",
  neuroticism: "#2C3E7B"
};
const LOW_CONFIDENCE_THRESHOLD = 50;
function ResultsPage() {
  const {
    sessionId
  } = Route.useParams();
  const {
    data,
    isLoading,
    error
  } = useGetResults(sessionId);
  const [expandedTrait, setExpandedTrait] = reactExports.useState(null);
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(ResultsSkeleton, {});
  }
  if (error) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-[60vh] items-center justify-center px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold text-white", children: "Session not found" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-400", children: "This assessment session could not be found or has expired." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "mt-6 inline-block rounded-lg bg-slate-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-600 transition-colors", children: "Back to Home" })
    ] }) });
  }
  if (!data) return null;
  const isLowConfidence = data.overallConfidence < LOW_CONFIDENCE_THRESHOLD;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-2xl px-4 py-8", "data-testid": "results-page", children: [
    isLowConfidence && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 rounded-xl border border-amber-700/30 bg-amber-900/20 p-4", "data-testid": "low-confidence-banner", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-amber-200", children: "Keep talking to see more accurate results" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-amber-300/70", children: "Some facets have low confidence. Continue your assessment for better accuracy." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/chat", search: {
        sessionId
      }, className: "mt-3 inline-block rounded-lg bg-amber-700/30 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-700/50 transition-colors", "data-testid": "continue-assessment-btn", children: "Continue Assessment" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ArchetypeCard, { archetypeName: data.archetypeName, oceanCode4: data.oceanCode4, oceanCode5: data.oceanCode5, description: data.archetypeDescription, color: data.archetypeColor, isCurated: data.isCurated, overallConfidence: data.overallConfidence }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 space-y-2", "data-testid": "trait-summary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-4 text-lg font-semibold text-white", children: "Your Traits" }),
      data.traits.map((trait) => {
        const traitFacets = data.facets.filter((f) => f.traitName === trait.name).map((f) => ({
          name: f.name,
          score: f.score,
          confidence: f.confidence
        }));
        const isExpanded = expandedTrait === trait.name;
        const controlsId = `facets-${trait.name}`;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TraitBar, { traitName: trait.name, score: trait.score, level: trait.level, confidence: trait.confidence, color: TRAIT_COLORS[trait.name] ?? "#6B7280", isExpanded, onToggle: () => setExpandedTrait(isExpanded ? null : trait.name), controlsId }),
          isExpanded && /* @__PURE__ */ jsxRuntimeExports.jsx(FacetBreakdown, { traitName: trait.name, facets: traitFacets, traitScore: trait.score, id: controlsId })
        ] }, trait.name);
      })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center", children: [
      isLowConfidence && /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/chat", search: {
        sessionId
      }, className: "rounded-lg bg-slate-700 px-6 py-2.5 text-center text-sm font-medium text-white hover:bg-slate-600 transition-colors", children: "Continue Assessment" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", disabled: true, className: "rounded-lg bg-slate-800 px-6 py-2.5 text-sm font-medium text-slate-500 cursor-not-allowed", "data-testid": "share-archetype-btn", children: "Share My Archetype" })
    ] })
  ] });
}
function ResultsSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-2xl px-4 py-8", "data-testid": "results-skeleton", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "animate-pulse rounded-2xl border border-slate-700/50 bg-slate-800/80 p-6 md:p-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 w-full rounded bg-slate-700" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 h-8 w-3/4 rounded bg-slate-700" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-7 w-16 rounded bg-slate-700" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-7 w-20 rounded bg-slate-700" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-full rounded bg-slate-700" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-5/6 rounded bg-slate-700" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-32 rounded bg-slate-700" }),
      ["skel-o", "skel-c", "skel-e", "skel-a", "skel-n"].map((id) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "animate-pulse rounded-xl border border-slate-700/50 bg-slate-800/60 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-3 rounded-full bg-slate-700" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-28 rounded bg-slate-700" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-12 rounded bg-slate-700" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 h-2 w-full rounded-full bg-slate-700" })
      ] }, id))
    ] })
  ] });
}
export {
  ResultsPage as component
};
