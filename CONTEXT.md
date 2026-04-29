# Big Ocean Context

Shared domain language for Big Ocean architecture discussions. This file records terms whose meaning should stay stable across code, tests, and planning artifacts.

## Language

**Assessment Finalization**:
The completion step that turns a finished Nerin conversation into persisted assessment results, a UserSummary, and queued portrait generation.
_Avoid_: lazy finalization, result generation

**Authenticated Conversation**:
A Nerin conversation owned by a signed-in user from its first turn.
_Avoid_: anonymous session, guest session

**UserSummary**:
A persisted compressed representation of a user's personality evidence, themes, tensions, and quote bank for downstream Nerin-voiced surfaces.
_Avoid_: summary blob, profile summary

**Portrait**:
The long-form Nerin-written personality letter generated from finalized assessment data.
_Avoid_: result, report

## Relationships

- An **Assessment Finalization** belongs to exactly one **Authenticated Conversation**.
- An **Assessment Finalization** produces exactly one scored assessment result.
- An **Assessment Finalization** requires a **UserSummary** before it can complete.
- An **Assessment Finalization** queues **Portrait** generation after the result and UserSummary are ready.

## Example Dialogue

> **Dev:** "Can `/results` finish an assessment if the user refreshes during finalization?"
> **Domain expert:** "No. `/results` only reads. **Assessment Finalization** owns the transition to a completed result."

## Flagged Ambiguities

- "results generation" has been used for both scoring and the whole completion workflow. Resolved: use **Assessment Finalization** for the whole workflow and "scoring" for facet/trait computation.
- Historical migrations may still mention legacy conversation tokens. Resolved: active product flow uses **Authenticated Conversation** only.
