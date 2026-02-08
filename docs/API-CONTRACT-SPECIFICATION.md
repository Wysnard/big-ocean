# API Contract Specification Guide

This document defines the mandatory fields and conventions for specifying API contracts in the big-ocean project. All new HTTP API contracts (`packages/contracts/src/http/groups/*.ts`) must follow this template.

## Why This Exists

In Epic 4, a confidence value was displayed incorrectly because the frontend assumed 0-1 decimals while the backend returned 0-100 integers. This guide prevents ambiguity by requiring explicit documentation of scales, units, and validation rules for all API fields.

## Mandatory Fields for Every API Contract

### 1. Field Name & Type

```typescript
/** Confidence score for the assessment.
 *  Scale: 0-100 integer (NOT 0-1 decimal)
 *  Unit: percentage points
 *  Validation: min=0, max=100, integer only
 *  Example: 73
 */
confidence: S.Number.pipe(S.int(), S.between(0, 100))
```

### 2. Scale & Units (Required)

Every numeric field must document:

| Attribute | Description | Example |
|-----------|-------------|---------|
| **Scale** | The range of valid values | `0-100`, `0-1`, `0-120` |
| **Unit** | What the number represents | `percentage points`, `cents`, `seconds` |
| **Format** | Integer vs decimal, precision | `integer only`, `2 decimal places` |

### 3. Validation Rules (Required)

```typescript
// Inline with Effect Schema
S.Number.pipe(
  S.int(),           // Integer constraint
  S.between(0, 100), // Range constraint
)
```

Document constraints explicitly:
- **Min/Max bounds**: `0-100`, `>= 0`
- **Required vs Optional**: Use `S.optional()` for optional fields
- **Format constraints**: Regex patterns, string length, enum values
- **Nullability**: Document if `null` is a valid value

### 4. Example Values (Required)

Every field must include at least one example:

```typescript
/** @example 73 */        // For simple values
/** @example "HHMHM" */   // For string patterns
/** @example { score: 15, confidence: 80 } */ // For objects
```

## Contract Template

When creating a new endpoint, follow this structure:

```typescript
/**
 * [Endpoint Name]
 *
 * Purpose: [What this endpoint does]
 * Auth: [Required | Optional | Anonymous]
 * Rate Limit: [Limit description or "none"]
 */

// === Request Schema ===
const RequestSchema = S.Struct({
  /**
   * [Field description]
   * Scale: [range]
   * Unit: [unit name]
   * Validation: [constraints]
   * Example: [value]
   */
  fieldName: S.String.pipe(S.minLength(1)),
});

// === Response Schema ===
const ResponseSchema = S.Struct({
  /**
   * [Field description]
   * Scale: [range]
   * Unit: [unit name]
   * Format: [integer | decimal | string pattern]
   * Example: [value]
   */
  fieldName: S.Number.pipe(S.int(), S.between(0, 100)),
});

// === Error Responses ===
// Document each possible error:
// - 400: Invalid input (validation failure)
// - 404: Resource not found
// - 429: Rate limit exceeded
// - 503: Budget paused
```

## Common Patterns in big-ocean

### Confidence Values

```typescript
/**
 * Assessment confidence score.
 * Scale: 0-100 integer
 * Unit: percentage points
 * Meaning: 0 = no data, 100 = maximum confidence
 * Thresholds: < 50 = preliminary, >= 50 = displayable, >= 70 = celebration
 * Example: 73
 *
 * WARNING: This is NOT a 0-1 decimal. Do not multiply by 100 on the frontend.
 */
confidence: S.Number.pipe(S.int(), S.between(0, 100))
```

### Facet Scores

```typescript
/**
 * Individual facet score within a trait.
 * Scale: 0-20 integer
 * Unit: raw score points
 * Aggregation: 6 facets sum to trait score (0-120)
 * Example: 15
 */
score: S.Number.pipe(S.int(), S.between(0, 20))
```

### Trait Scores

```typescript
/**
 * Aggregated trait score (sum of 6 facet scores).
 * Scale: 0-120 integer
 * Unit: raw score points
 * Thresholds: 0-40 = Low (L), 40-80 = Mid (M), 80-120 = High (H)
 * Example: 84 (High)
 */
traitScore: S.Number.pipe(S.int(), S.between(0, 120))
```

### OCEAN Codes

```typescript
/**
 * 5-letter personality code (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism).
 * Format: /^[LMH]{5}$/ (exactly 5 characters, each L/M/H)
 * Type: OceanCode5 (template literal type)
 * Example: "HHMHM"
 */
oceanCode: S.String.pipe(S.pattern(/^[LMH]{5}$/))
```

### Cost Values

```typescript
/**
 * Token cost in cents.
 * Scale: >= 0 integer
 * Unit: US cents (1/100 of a dollar)
 * Formula: ceil((input/1M * 0.003 + output/1M * 0.015) * 100)
 * Example: 3 (= $0.03)
 */
costCents: S.Number.pipe(S.int(), S.greaterThanOrEqualTo(0))
```

## Code Review Checklist

When reviewing API contract changes, verify:

- [ ] Every numeric field has Scale and Unit documented
- [ ] Every field has at least one Example value
- [ ] Validation rules match documented constraints
- [ ] No ambiguous terms (e.g., "score" without specifying scale)
- [ ] Response types match what the backend actually returns
- [ ] Breaking changes are called out explicitly

## References

- Effect Schema docs: `@effect/schema`
- Existing contracts: `packages/contracts/src/http/groups/`
- Domain types: `packages/domain/src/types/`
