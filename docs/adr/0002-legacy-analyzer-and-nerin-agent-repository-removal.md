# Legacy Analyzer + Nerin-agent repository removal

**Status:** accepted (2026-04-30)

Pre-Director **`AnalyzerRepository`** and leftover **`NerinAgentRepository`** (monolithic Nerin) are removed from `packages/domain` and `packages/infrastructure` — they were unwired **Context.Tag** layers after the Director model (**ADR-31–38**). Live assessment chat uses **`ConversanalyzerRepository`**, **`NerinDirectorRepository`**, and **`NerinActorRepository`** only.

**Offline script:** `scripts/eval-portrait.ts` and `pnpm eval:portrait` are removed; it depended on the old analyzer. Portrait quality measurement is **ADR-54** in `_bmad-output/planning-artifacts/architecture.md` (rubric skill + baseline), not a repo script.

**Full ADR text:** **ADR-57** in `_bmad-output/planning-artifacts/architecture.md` (authoritative copy).

**Considered options:** (a) keep dead layers for hypothetical scripts — rejected (misleading, duplicate types); (b) migrate `eval-portrait.ts` to Conversanalyzer — rejected (ADR-54 supersedes that workflow); (c) delete seams + script — chosen.

**Consequences:** Any external tooling must call **`ConversanalyzerRepository`** and current evidence shapes (**ADR-27**). E2E mocks: Director, Actor, ConversAnalyzer (no legacy Nerin-agent mock layer).
