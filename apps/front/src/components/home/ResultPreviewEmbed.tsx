import { Link } from "@tanstack/react-router";
import type * as React from "react";

interface ResultPreviewEmbedProps {
  ctaText: string;
  children: React.ReactNode;
}

export function ResultPreviewEmbed({
  ctaText,
  children,
}: ResultPreviewEmbedProps) {
  return (
    <div
      data-slot="result-preview-embed"
      className="mt-[14px] rounded-xl border border-[var(--embed-border)] bg-[var(--embed-bg)] p-[18px] backdrop-blur-[4px] transition-[background,border-color] duration-[350ms]"
    >
      {/* Preview content — displayed clearly */}
      {children}
      {/* CTA pill */}
      <div className="mt-3 flex justify-center">
        <Link
          to="/chat"
          className="rounded-lg bg-primary px-4 py-2 font-heading text-xs font-semibold text-white shadow-[0_4px_14px_rgba(255,0,128,.3)] transition-transform duration-200 hover:translate-y-[-1px]"
        >
          {ctaText} &rarr;
        </Link>
      </div>
    </div>
  );
}

/** OCEAN Code display */
export function OceanCodeEmbed() {
  const traits = [
    { letter: "H", label: "Open", trait: "openness" },
    { letter: "H", label: "Consc", trait: "conscientiousness" },
    { letter: "M", label: "Extra", trait: "extraversion" },
    { letter: "H", label: "Agree", trait: "agreeableness" },
    { letter: "M", label: "Neuro", trait: "neuroticism" },
  ];

  return (
    <ResultPreviewEmbed ctaText="Take assessment to reveal yours">
      <div className="flex justify-center gap-[10px]">
        {traits.map((t) => (
          <div key={t.trait} className="flex flex-col items-center gap-1">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-[9px] font-heading text-[1.1rem] font-bold text-white max-[480px]:h-[38px] max-[480px]:w-[38px] max-[480px]:text-[.95rem]"
              style={{ background: `var(--trait-${t.trait})` }}
            >
              {t.letter}
            </div>
            <div className="font-mono text-[.5rem] text-[var(--muted-dynamic)] transition-colors duration-[350ms]">
              {t.label}
            </div>
          </div>
        ))}
      </div>
    </ResultPreviewEmbed>
  );
}

/** Radar/trait overview */
export function RadarEmbed() {
  const traits = [
    { name: "Openness", score: 92, trait: "openness" },
    { name: "Conscientiousness", score: 88, trait: "conscientiousness" },
    { name: "Extraversion", score: 65, trait: "extraversion" },
    { name: "Agreeableness", score: 78, trait: "agreeableness" },
    { name: "Neuroticism", score: 52, trait: "neuroticism" },
  ];

  return (
    <ResultPreviewEmbed ctaText="See your scores">
      <div className="flex flex-wrap items-center justify-center gap-5 max-[900px]:flex-col">
        {/* Radar SVG */}
        <svg width="160" height="160" viewBox="0 0 200 200" aria-hidden="true">
          <polygon
            points="100,20 175,65 155,155 45,155 25,65"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity=".12"
          />
          <polygon
            points="100,45 155,75 142,140 58,140 45,75"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity=".06"
          />
          <polygon
            points="100,28 168,72 140,148 55,135 35,70"
            fill="var(--radar-fill)"
            stroke="var(--primary)"
            strokeWidth="2"
          />
          {[
            { cx: 100, cy: 28, trait: "openness" },
            { cx: 168, cy: 72, trait: "conscientiousness" },
            { cx: 140, cy: 148, trait: "extraversion" },
            { cx: 55, cy: 135, trait: "agreeableness" },
            { cx: 35, cy: 70, trait: "neuroticism" },
          ].map((p) => (
            <circle
              key={p.trait}
              cx={p.cx}
              cy={p.cy}
              r="4"
              fill={`var(--trait-${p.trait})`}
            />
          ))}
        </svg>
        {/* Legend */}
        <div className="flex flex-col gap-[6px]">
          {traits.map((t) => (
            <div
              key={t.trait}
              className="flex items-center gap-[7px] text-[.75rem] text-[var(--muted-dynamic)] transition-colors duration-[350ms]"
            >
              <div
                className="h-[7px] w-[7px] shrink-0 rounded-[3px]"
                style={{ background: `var(--trait-${t.trait})` }}
              />
              {t.name}: {t.score}/120
            </div>
          ))}
        </div>
      </div>
    </ResultPreviewEmbed>
  );
}

/** 30-facet breakdown */
export function FacetBarsEmbed() {
  const traitGroups = [
    {
      trait: "openness",
      label: "Open",
      facets: [
        { name: "Imagin", pct: 85 },
        { name: "Artistic", pct: 92 },
        { name: "Emotion", pct: 70 },
        { name: "Advent", pct: 78 },
        { name: "Intellect", pct: 95 },
        { name: "Liberal", pct: 80 },
      ],
    },
    {
      trait: "conscientiousness",
      label: "Consc",
      facets: [
        { name: "Efficacy", pct: 88 },
        { name: "Order", pct: 72 },
        { name: "Dutiful", pct: 80 },
        { name: "Achieve", pct: 90 },
        { name: "Discipl", pct: 75 },
        { name: "Cautious", pct: 65 },
      ],
    },
    {
      trait: "extraversion",
      label: "Extra",
      facets: [
        { name: "Friendly", pct: 68 },
        { name: "Social", pct: 42 },
        { name: "Assert", pct: 72 },
        { name: "Active", pct: 58 },
        { name: "Excite", pct: 55 },
        { name: "Cheer", pct: 60 },
      ],
    },
    {
      trait: "agreeableness",
      label: "Agree",
      facets: [
        { name: "Trust", pct: 75 },
        { name: "Moral", pct: 82 },
        { name: "Altruism", pct: 80 },
        { name: "Cooperate", pct: 70 },
        { name: "Modest", pct: 55 },
        { name: "Sympath", pct: 85 },
      ],
    },
    {
      trait: "neuroticism",
      label: "Neuro",
      facets: [
        { name: "Anxiety", pct: 50 },
        { name: "Anger", pct: 35 },
        { name: "Depress", pct: 40 },
        { name: "Self-Con", pct: 55 },
        { name: "Immod", pct: 48 },
        { name: "Vulner", pct: 45 },
      ],
    },
  ];

  return (
    <ResultPreviewEmbed ctaText="Reveal your 30 facets">
      <div className="grid grid-cols-5 gap-[10px] max-[900px]:grid-cols-2 max-[480px]:grid-cols-1">
        {traitGroups.map((group) => (
          <div key={group.trait}>
            <h4
              className="mb-[6px] flex items-center gap-[5px] font-heading text-[.65rem] font-semibold"
              style={{ color: `var(--trait-${group.trait})` }}
            >
              <span
                className="inline-block h-[6px] w-[6px] shrink-0 rounded-full"
                style={{ background: `var(--trait-${group.trait})` }}
              />
              {group.label}
            </h4>
            {group.facets.map((f) => (
              <div
                key={f.name}
                className="mb-1 flex items-center gap-[6px] text-[.6rem] text-[var(--muted-dynamic)] transition-colors duration-[350ms]"
              >
                {f.name}
                <div
                  className="h-1 flex-1 overflow-hidden rounded-[2px] transition-[background] duration-[350ms]"
                  style={{ background: "var(--bar-track)" }}
                >
                  <div
                    className="h-full rounded-[2px]"
                    style={{
                      width: `${f.pct}%`,
                      background: `var(--trait-${group.trait})`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </ResultPreviewEmbed>
  );
}
