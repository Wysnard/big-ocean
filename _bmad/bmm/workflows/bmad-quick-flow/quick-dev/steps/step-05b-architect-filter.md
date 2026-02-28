---
name: 'step-05b-architect-filter'
description: 'Architect filters adversarial findings to critical-only before resolution'

nextStepFile: './step-06-resolve-findings.md'
---

# Step 5b: Architect Critical-Only Filter

**Goal:** Review adversarial findings through an architectural lens and retain only those that are critical — issues that would cause bugs, data loss, security vulnerabilities, or architectural violations if shipped.

---

## AVAILABLE STATE

From previous steps:

- Findings table from step-05 (numbered F1, F2, F3, etc. with Severity and Validity)

---

## FILTER PROCESS

### 1. Apply Architectural Lens

For each finding, ask:

- **Would this cause a bug, data loss, or security issue in production?**
- **Does this violate a hard architectural rule?** (e.g., business logic in handlers, error location rules, missing production layer)
- **Would this break the contract between layers?** (handlers ↔ use-cases ↔ domain ↔ infrastructure)

### 2. Classification

Classify each finding into exactly one category:

- **KEEP** — Critical architectural or correctness issue. Must be fixed.
- **DROP** — Style preference, minor improvement, or low-risk suggestion. Not worth the churn.

### 3. Hard Rules (Always KEEP)

These findings are always critical regardless of severity label:

- Business logic in handlers (handler-layer boundary violation)
- Missing repository layer in production `Layer.mergeAll`
- Error remapping in use-cases or handlers (violates error propagation rule)
- Missing `addError()` on HTTP endpoint for an error the use-case can produce
- Security issues (injection, auth bypass, data exposure)

### 4. Present Filtered Results

Output a table:

| ID | Decision | Reason |
|----|----------|--------|
| F1 | KEEP | {one-line reason} |
| F2 | DROP | {one-line reason} |
| ... | ... | ... |

Then present only the **KEEP** findings as the input for step 06.

If all findings are dropped, note this and proceed directly to step 06 completion (skip resolution).

---

## NEXT STEP

With filtered findings, read fully and follow: `step-06-resolve-findings.md` for resolution.

---

## SUCCESS METRICS

- Every finding from step-05 has a KEEP/DROP decision with reasoning
- Hard-rule violations are never dropped
- Style/preference findings are dropped to reduce noise
- Only KEEP findings are carried forward to resolution

## FAILURE MODES

- Keeping everything (defeats the purpose of filtering)
- Dropping a hard-rule violation
- No reasoning provided for decisions
