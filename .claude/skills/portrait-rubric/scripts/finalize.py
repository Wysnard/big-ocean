#!/usr/bin/env python3
"""Deterministic finalization for portrait-rubric scoring.

Three subcommands cover the load-bearing correctness operations that
should never be done by the LLM in prose:

- validate: schema-check a per-portrait rubric JSON, compute the
  judge-prompt hash, recompute overall_score with the insight-cap
  rule, and write the finalized JSON.
- aggregate: read a directory of per-portrait rubric JSONs from a
  corpus run and produce a corpus aggregate with deterministic
  medians and means per dimension.
- diff: compare a current corpus aggregate against a baseline corpus
  aggregate; flag any dimension whose median dropped by more than the
  threshold (default 0.5) as a regression.

All three are pure stdlib. No external dependencies. No `uv` needed.
Invoke directly with `python3 finalize.py <subcommand> ...`.
"""

# /// script
# requires-python = ">=3.9"
# ///

from __future__ import annotations

import argparse
import hashlib
import json
import statistics
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DIMENSIONS = [
    "insight_beneath_observation",
    "spine_coherence",
    "arc_fidelity",
    "coined_phrase_quality",
    "self_compelling",
    "voice",
    "emotional_stake",
]

INSIGHT_CAP_DIMENSION = "insight_beneath_observation"
INSIGHT_CAP_THRESHOLD = 2  # score <= this triggers the cap
INSIGHT_CAP_CEILING = 2.5  # overall cannot exceed this when insight fails
DEFAULT_REGRESSION_THRESHOLD = 0.5


class ValidationError(Exception):
    """Raised when a rubric JSON fails schema validation."""


def sha256_file(path: Path) -> str:
    """Return the SHA-256 hex digest of a file's contents."""
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def validate_schema(data: dict[str, Any]) -> None:
    """Raise ValidationError if the rubric JSON doesn't match the schema."""
    required_top = {
        "portrait_id",
        "rubric_version",
        "rubric_prompt_sha",
        "timestamp",
        "dimensions",
        "overall_score",
        "overall_take",
        "flags",
    }
    missing = required_top - set(data.keys())
    if missing:
        raise ValidationError(f"missing top-level fields: {sorted(missing)}")

    if not isinstance(data["dimensions"], dict):
        raise ValidationError("dimensions must be an object")
    missing_dims = set(DIMENSIONS) - set(data["dimensions"].keys())
    if missing_dims:
        raise ValidationError(f"missing dimensions: {sorted(missing_dims)}")

    for dim_name in DIMENSIONS:
        dim = data["dimensions"][dim_name]
        if not isinstance(dim, dict):
            raise ValidationError(f"dimension {dim_name} must be an object")
        if "score" not in dim or "rationale" not in dim:
            raise ValidationError(f"dimension {dim_name} missing score or rationale")
        score = dim["score"]
        if not isinstance(score, int) or score < 1 or score > 5:
            raise ValidationError(
                f"dimension {dim_name} score must be integer 1-5, got {score!r}"
            )
        if not isinstance(dim["rationale"], str) or not dim["rationale"].strip():
            raise ValidationError(f"dimension {dim_name} rationale must be non-empty string")

    if not isinstance(data["flags"], list):
        raise ValidationError("flags must be a list")
    if not isinstance(data["overall_take"], str):
        raise ValidationError("overall_take must be a string")


def compute_overall_score(dimensions: dict[str, dict[str, Any]]) -> float:
    """Compute overall_score with the insight-cap rule applied.

    Rule: mean of the 7 dimension scores, rounded to 1 decimal. If
    insight_beneath_observation <= INSIGHT_CAP_THRESHOLD, the overall
    score is capped at INSIGHT_CAP_CEILING regardless of the mean — a
    surface-level reading cannot be a good portrait.
    """
    scores = [dimensions[d]["score"] for d in DIMENSIONS]
    mean = round(sum(scores) / len(scores), 1)
    if dimensions[INSIGHT_CAP_DIMENSION]["score"] <= INSIGHT_CAP_THRESHOLD:
        return min(mean, INSIGHT_CAP_CEILING)
    return mean


def cmd_validate(args: argparse.Namespace) -> int:
    """Validate a per-portrait rubric JSON and write the finalized version.

    Steps:
    1. Read the raw JSON.
    2. Validate the schema.
    3. Compute the judge-prompt SHA-256 and replace the placeholder.
    4. Recompute overall_score with the insight-cap rule.
    5. Write the finalized JSON to --out (or overwrite input if --in-place).
    """
    input_path = Path(args.input)
    if not input_path.is_file():
        print(f"error: input file not found: {input_path}", file=sys.stderr)
        return 1

    try:
        data = json.loads(input_path.read_text())
    except json.JSONDecodeError as e:
        print(f"error: invalid JSON in {input_path}: {e}", file=sys.stderr)
        return 1

    try:
        validate_schema(data)
    except ValidationError as e:
        print(f"error: schema validation failed: {e}", file=sys.stderr)
        return 1

    judge_prompt_path = Path(args.judge_prompt)
    if not judge_prompt_path.is_file():
        print(
            f"error: judge prompt file not found: {judge_prompt_path}",
            file=sys.stderr,
        )
        return 1
    data["rubric_prompt_sha"] = sha256_file(judge_prompt_path)

    data["overall_score"] = compute_overall_score(data["dimensions"])

    if args.in_place:
        output_path = input_path
    elif args.out:
        output_path = Path(args.out)
    else:
        print("error: --out or --in-place required", file=sys.stderr)
        return 1

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(data, indent=2) + "\n")
    print(f"validated and finalized: {output_path}")
    print(f"overall_score: {data['overall_score']}")
    print(f"rubric_prompt_sha: {data['rubric_prompt_sha'][:8]}...")
    return 0


def cmd_aggregate(args: argparse.Namespace) -> int:
    """Aggregate per-portrait JSONs into a corpus aggregate.

    Reads all *.json files in the input directory that match the
    single-portrait schema, computes deterministic means and medians
    per dimension, and writes an aggregate JSON.
    """
    input_dir = Path(args.input_dir)
    if not input_dir.is_dir():
        print(f"error: input directory not found: {input_dir}", file=sys.stderr)
        return 1

    results: list[dict[str, Any]] = []
    skipped: list[tuple[str, str]] = []
    for json_path in sorted(input_dir.glob("*.json")):
        if json_path.name.endswith(".raw.json"):
            continue  # skip un-finalized raw outputs
        if json_path.stem.endswith("-corpus") or json_path.stem.endswith("-diff"):
            continue  # skip prior aggregates
        try:
            data = json.loads(json_path.read_text())
            validate_schema(data)
        except (json.JSONDecodeError, ValidationError) as e:
            skipped.append((json_path.name, str(e)))
            continue
        results.append(data)

    if not results:
        print("error: no valid rubric JSONs found", file=sys.stderr)
        if skipped:
            for name, reason in skipped:
                print(f"  skipped {name}: {reason}", file=sys.stderr)
        return 1

    medians: dict[str, float] = {}
    means: dict[str, float] = {}
    for dim in DIMENSIONS:
        scores = [r["dimensions"][dim]["score"] for r in results]
        medians[dim] = round(statistics.median(scores), 2)
        means[dim] = round(statistics.fmean(scores), 2)

    overall_scores = [r["overall_score"] for r in results]
    medians["overall"] = round(statistics.median(overall_scores), 2)
    means["overall"] = round(statistics.fmean(overall_scores), 2)

    # All results should share the same rubric_prompt_sha — warn if not.
    shas = {r["rubric_prompt_sha"] for r in results}
    sha_mismatch_warning = None
    if len(shas) > 1:
        sha_mismatch_warning = (
            f"warning: corpus contains {len(shas)} distinct rubric_prompt_sha values; "
            "scores from different judge prompt versions are not strictly comparable"
        )

    aggregate = {
        "rubric_version": results[0]["rubric_version"],
        "rubric_prompt_sha": next(iter(shas)) if len(shas) == 1 else "MIXED",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "portrait_count": len(results),
        "results": results,
        "medians": medians,
        "means": means,
    }
    if sha_mismatch_warning:
        aggregate["warning"] = sha_mismatch_warning

    output_path = Path(args.out)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(aggregate, indent=2) + "\n")

    print(f"aggregated {len(results)} portraits → {output_path}")
    if skipped:
        print(f"skipped {len(skipped)} invalid files:")
        for name, reason in skipped:
            print(f"  {name}: {reason}")
    if sha_mismatch_warning:
        print(sha_mismatch_warning)
    print("\nmedians by dimension:")
    for dim in DIMENSIONS + ["overall"]:
        print(f"  {dim}: {medians[dim]}")
    return 0


def cmd_diff(args: argparse.Namespace) -> int:
    """Compare a current corpus aggregate against a baseline.

    Flags any dimension whose median dropped by more than --threshold
    as a regression. Emits a diff JSON with deltas, regressions, and
    an overall pass/fail.
    """
    current_path = Path(args.current)
    baseline_path = Path(args.baseline)
    if not current_path.is_file():
        print(f"error: current aggregate not found: {current_path}", file=sys.stderr)
        return 1
    if not baseline_path.is_file():
        print(f"error: baseline aggregate not found: {baseline_path}", file=sys.stderr)
        return 1

    current = json.loads(current_path.read_text())
    baseline = json.loads(baseline_path.read_text())

    if "medians" not in current or "medians" not in baseline:
        print("error: both inputs must be corpus aggregates with 'medians'", file=sys.stderr)
        return 1

    threshold = args.threshold
    deltas: dict[str, dict[str, float]] = {}
    regressions: list[dict[str, Any]] = []
    for dim in DIMENSIONS + ["overall"]:
        if dim not in current["medians"] or dim not in baseline["medians"]:
            continue
        curr_val = current["medians"][dim]
        base_val = baseline["medians"][dim]
        delta = round(curr_val - base_val, 2)
        deltas[dim] = {"current": curr_val, "baseline": base_val, "delta": delta}
        if delta < -threshold:
            regressions.append(
                {
                    "dimension": dim,
                    "current": curr_val,
                    "baseline": base_val,
                    "delta": delta,
                }
            )

    sha_warning = None
    if current.get("rubric_prompt_sha") != baseline.get("rubric_prompt_sha"):
        sha_warning = (
            "warning: current and baseline were scored with different judge prompt versions "
            f"(current={current.get('rubric_prompt_sha', '?')[:8]}..., "
            f"baseline={baseline.get('rubric_prompt_sha', '?')[:8]}...); "
            "score comparison is approximate"
        )

    diff = {
        "threshold": threshold,
        "passed": len(regressions) == 0,
        "regressions": regressions,
        "deltas": deltas,
        "current_portraits": current.get("portrait_count", len(current.get("results", []))),
        "baseline_portraits": baseline.get("portrait_count", len(baseline.get("results", []))),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if sha_warning:
        diff["warning"] = sha_warning

    output_path = Path(args.out)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(diff, indent=2) + "\n")

    if sha_warning:
        print(sha_warning)
    if regressions:
        print(f"REGRESSIONS DETECTED ({len(regressions)}):")
        for r in regressions:
            print(
                f"  {r['dimension']}: {r['baseline']} → {r['current']} "
                f"(delta {r['delta']:+.2f})"
            )
        print(f"\ndiff written to: {output_path}")
        return 2  # non-zero to signal regression for CI use
    print("no regressions detected")
    print(f"diff written to: {output_path}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Deterministic finalization for portrait-rubric scoring",
    )
    sub = parser.add_subparsers(dest="subcommand", required=True)

    p_validate = sub.add_parser(
        "validate",
        help="Validate a per-portrait rubric JSON and finalize it",
    )
    p_validate.add_argument("input", help="Path to the raw rubric JSON")
    p_validate.add_argument(
        "--judge-prompt",
        required=True,
        help="Path to references/rubric-judge-prompt.md (for SHA hashing)",
    )
    out_group = p_validate.add_mutually_exclusive_group(required=True)
    out_group.add_argument("--out", help="Output path for finalized JSON")
    out_group.add_argument(
        "--in-place",
        action="store_true",
        help="Overwrite the input file in place",
    )
    p_validate.set_defaults(func=cmd_validate)

    p_aggregate = sub.add_parser(
        "aggregate",
        help="Aggregate per-portrait JSONs into a corpus aggregate",
    )
    p_aggregate.add_argument(
        "input_dir",
        help="Directory containing finalized per-portrait rubric JSONs",
    )
    p_aggregate.add_argument("--out", required=True, help="Output path for aggregate JSON")
    p_aggregate.set_defaults(func=cmd_aggregate)

    p_diff = sub.add_parser(
        "diff",
        help="Compare a current corpus aggregate against a baseline aggregate",
    )
    p_diff.add_argument("current", help="Current corpus aggregate JSON")
    p_diff.add_argument("baseline", help="Baseline corpus aggregate JSON")
    p_diff.add_argument(
        "--threshold",
        type=float,
        default=DEFAULT_REGRESSION_THRESHOLD,
        help=f"Median drop required to flag a regression (default {DEFAULT_REGRESSION_THRESHOLD})",
    )
    p_diff.add_argument("--out", required=True, help="Output path for diff JSON")
    p_diff.set_defaults(func=cmd_diff)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
