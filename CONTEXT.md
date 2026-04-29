# Big Ocean Context

Shared domain language for Big Ocean architecture discussions. This file records terms whose meaning should stay stable across code, tests, and planning artifacts.

## Language

**Assessment Finalization**:
The completion step that turns a finished Nerin conversation into persisted assessment results, a UserSummary, queued portrait generation, and—before success is returned—the idempotent creation of the session’s shareable public profile row (private by default) so read paths such as `/results` only query profile metadata; they do not create that row.
*Avoid*: lazy finalization, result generation

**Authenticated Conversation**:
A Nerin conversation owned by a signed-in user from its first turn.
*Avoid*: anonymous session, guest session

**UserSummary**:
A persisted compressed representation of a user's personality evidence, themes, tensions, and quote bank for downstream Nerin-voiced surfaces.
*Avoid*: summary blob, profile summary

**Portrait**:
The long-form Nerin-written personality letter generated from finalized assessment data.
*Avoid*: result, report

**Assessment surface**:
The read-time personality summary derived from facet scores: the five-letter OCEAN code, its four-letter form, and the matched archetype metadata (name, description, color, curated flag). It is computed from the canonical facet map — never stored as a separate source of truth; storage holds facet-level scores only.
*Avoid*: OCEAN row, stored archetype
*Implementation*: `AssessmentSurfaceProjection` in `@workspace/domain`; hydrate persisted facets and derive the surface with `projectAssessmentSurfaceFromPersistedFacets`.

**Completed Assessment Results Read**:
The authenticated read of a finished **Authenticated Conversation** that returns the scored facet/trait presentation plus **Assessment surface**, latest-version metadata, and the session’s shareable public profile identifiers. It succeeds only when the persisted assessment result is at `stage=completed` and the session’s `public_profiles` row exists (provisioned during **Assessment Finalization**).
*Avoid*: lazy results, partial results payload

**Public profile row (shareable)**:
The persisted `public_profiles` record for a completed assessment session (private by default), used to build stable share URLs and visibility state for the **Completed Assessment Results Read**.
*Avoid*: lazy profile creation on `/results`

## Relationships

- An **Assessment Finalization** belongs to exactly one **Authenticated Conversation**.
- An **Assessment Finalization** produces exactly one scored assessment result.
- An **Assessment Finalization** requires a **UserSummary** before it can complete.
- An **Assessment Finalization** queues **Portrait** generation after the result and UserSummary are ready.
- An **Assessment Finalization** provisions the session’s shareable public profile row (private by default); `/results` reads that row and does not create it.
- A **Completed Assessment Results Read** requires both `assessment_results.stage=completed` and an existing **Public profile row (shareable)** for the same session.
- An **Assessment surface** is derived from the same facet scores that feed trait views and confidence; it does not replace **UserSummary** or **Portrait**.

## Example Dialogue

> **Dev:** "Can `/results` finish an assessment if the user refreshes during finalization?"
> **Domain expert:** "No. `/results` only reads. **Assessment Finalization** owns the transition to a completed result."

## Flagged Ambiguities

- "results generation" has been used for both scoring and the whole completion workflow. Resolved: use **Assessment Finalization** for the whole workflow and "scoring" for facet/trait computation.
- Historical migrations may still mention legacy conversation tokens. Resolved: active product flow uses **Authenticated Conversation** only.