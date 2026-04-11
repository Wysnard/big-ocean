#!/usr/bin/env python3
"""Tests for portrait-rubric finalize.py.

Run from the skill root:
    python3 -m unittest scripts.tests.test_finalize

Or directly:
    python3 scripts/tests/test_finalize.py
"""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

# Make the parent scripts/ directory importable so we can load finalize.py
SCRIPT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SCRIPT_DIR))

import finalize  # type: ignore  # noqa: E402


def make_valid_rubric(
    *,
    insight: int = 4,
    spine: int = 4,
    arc: int = 4,
    phrase: int = 4,
    compelling: int = 4,
    voice: int = 4,
    stake: int = 4,
    portrait_id: str = "test-portrait",
) -> dict:
    """Construct a valid per-portrait rubric JSON for testing."""
    return {
        "portrait_id": portrait_id,
        "rubric_version": "1.0",
        "rubric_prompt_sha": "<computed>",
        "timestamp": "2026-04-11T20:40:00+00:00",
        "dimensions": {
            "insight_beneath_observation": {
                "score": insight,
                "rationale": "The portrait surfaces a specific inference about the user.",
            },
            "spine_coherence": {
                "score": spine,
                "rationale": "One reading threads through all movements.",
            },
            "arc_fidelity": {
                "score": arc,
                "rationale": "Six movements are distinct and felt.",
            },
            "coined_phrase_quality": {
                "score": phrase,
                "rationale": "Three phrases are portable and prospective.",
            },
            "self_compelling": {
                "score": compelling,
                "rationale": "Reader would return to this unprompted.",
            },
            "voice": {
                "score": voice,
                "rationale": "Nerin confidant tone, no anti-patterns.",
            },
            "emotional_stake": {
                "score": stake,
                "rationale": "One unresolved cost lands emotionally.",
            },
        },
        "overall_score": 4.0,  # judge's best-effort — finalize.py will recompute
        "overall_take": "A strong portrait with clear inferential depth.",
        "flags": [],
    }


class TestValidateSchema(unittest.TestCase):
    def test_valid_passes(self):
        data = make_valid_rubric()
        finalize.validate_schema(data)  # should not raise

    def test_missing_dimension_fails(self):
        data = make_valid_rubric()
        del data["dimensions"]["voice"]
        with self.assertRaises(finalize.ValidationError) as ctx:
            finalize.validate_schema(data)
        self.assertIn("voice", str(ctx.exception))

    def test_out_of_range_score_fails(self):
        data = make_valid_rubric()
        data["dimensions"]["voice"]["score"] = 6
        with self.assertRaises(finalize.ValidationError) as ctx:
            finalize.validate_schema(data)
        self.assertIn("1-5", str(ctx.exception))

    def test_non_integer_score_fails(self):
        data = make_valid_rubric()
        data["dimensions"]["voice"]["score"] = 4.5
        with self.assertRaises(finalize.ValidationError):
            finalize.validate_schema(data)

    def test_missing_top_field_fails(self):
        data = make_valid_rubric()
        del data["timestamp"]
        with self.assertRaises(finalize.ValidationError) as ctx:
            finalize.validate_schema(data)
        self.assertIn("timestamp", str(ctx.exception))

    def test_empty_rationale_fails(self):
        data = make_valid_rubric()
        data["dimensions"]["voice"]["rationale"] = "   "
        with self.assertRaises(finalize.ValidationError):
            finalize.validate_schema(data)


class TestOverallScore(unittest.TestCase):
    def test_mean_computed_correctly(self):
        data = make_valid_rubric(insight=5, spine=4, arc=4, phrase=4, compelling=4, voice=4, stake=4)
        # mean = (5+4+4+4+4+4+4)/7 = 29/7 = 4.142857 → rounded to 4.1
        result = finalize.compute_overall_score(data["dimensions"])
        self.assertEqual(result, 4.1)

    def test_insight_cap_applied_when_insight_is_1(self):
        # Everything else is 5; without the cap mean would be ~4.43
        data = make_valid_rubric(
            insight=1, spine=5, arc=5, phrase=5, compelling=5, voice=5, stake=5
        )
        result = finalize.compute_overall_score(data["dimensions"])
        self.assertEqual(result, 2.5)

    def test_insight_cap_applied_when_insight_is_2(self):
        data = make_valid_rubric(
            insight=2, spine=5, arc=5, phrase=5, compelling=5, voice=5, stake=5
        )
        result = finalize.compute_overall_score(data["dimensions"])
        self.assertEqual(result, 2.5)

    def test_insight_cap_not_applied_when_insight_is_3(self):
        data = make_valid_rubric(
            insight=3, spine=5, arc=5, phrase=5, compelling=5, voice=5, stake=5
        )
        # mean = (3+5+5+5+5+5+5)/7 = 33/7 = 4.71 → 4.7
        result = finalize.compute_overall_score(data["dimensions"])
        self.assertEqual(result, 4.7)

    def test_insight_cap_does_not_raise_low_score(self):
        # If the mean is already below the cap, the cap doesn't inflate it
        data = make_valid_rubric(
            insight=1, spine=1, arc=1, phrase=1, compelling=1, voice=1, stake=1
        )
        result = finalize.compute_overall_score(data["dimensions"])
        self.assertEqual(result, 1.0)


class TestCmdValidate(unittest.TestCase):
    def test_validate_writes_finalized_json(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            raw = make_valid_rubric(insight=5, spine=5, arc=5, phrase=5, compelling=5, voice=5, stake=5)
            input_path = tmp_path / "raw.json"
            input_path.write_text(json.dumps(raw))

            judge_path = tmp_path / "judge.md"
            judge_path.write_text("# Judge prompt v1.0\n\nContent.\n")

            out_path = tmp_path / "final.json"
            rc = finalize.main(
                [
                    "validate",
                    str(input_path),
                    "--judge-prompt",
                    str(judge_path),
                    "--out",
                    str(out_path),
                ]
            )
            self.assertEqual(rc, 0)
            self.assertTrue(out_path.is_file())
            finalized = json.loads(out_path.read_text())
            # SHA must be a 64-char hex string, not the placeholder
            self.assertNotEqual(finalized["rubric_prompt_sha"], "<computed>")
            self.assertEqual(len(finalized["rubric_prompt_sha"]), 64)
            # overall_score must be the deterministic mean (5.0)
            self.assertEqual(finalized["overall_score"], 5.0)

    def test_validate_applies_insight_cap_in_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            raw = make_valid_rubric(insight=2, spine=5, arc=5, phrase=5, compelling=5, voice=5, stake=5)
            # Judge's overall is deliberately wrong (too high) to prove finalize.py overrides it
            raw["overall_score"] = 4.4
            input_path = tmp_path / "raw.json"
            input_path.write_text(json.dumps(raw))

            judge_path = tmp_path / "judge.md"
            judge_path.write_text("judge")

            out_path = tmp_path / "final.json"
            rc = finalize.main(
                [
                    "validate",
                    str(input_path),
                    "--judge-prompt",
                    str(judge_path),
                    "--out",
                    str(out_path),
                ]
            )
            self.assertEqual(rc, 0)
            finalized = json.loads(out_path.read_text())
            self.assertEqual(finalized["overall_score"], 2.5)

    def test_validate_fails_on_invalid_schema(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            raw = make_valid_rubric()
            del raw["dimensions"]["voice"]
            input_path = tmp_path / "raw.json"
            input_path.write_text(json.dumps(raw))

            judge_path = tmp_path / "judge.md"
            judge_path.write_text("judge")

            out_path = tmp_path / "final.json"
            rc = finalize.main(
                [
                    "validate",
                    str(input_path),
                    "--judge-prompt",
                    str(judge_path),
                    "--out",
                    str(out_path),
                ]
            )
            self.assertEqual(rc, 1)
            self.assertFalse(out_path.is_file())

    def test_validate_in_place(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            raw = make_valid_rubric()
            input_path = tmp_path / "rubric.json"
            input_path.write_text(json.dumps(raw))

            judge_path = tmp_path / "judge.md"
            judge_path.write_text("judge")

            rc = finalize.main(
                [
                    "validate",
                    str(input_path),
                    "--judge-prompt",
                    str(judge_path),
                    "--in-place",
                ]
            )
            self.assertEqual(rc, 0)
            finalized = json.loads(input_path.read_text())
            self.assertNotEqual(finalized["rubric_prompt_sha"], "<computed>")


class TestCmdAggregate(unittest.TestCase):
    def test_aggregate_computes_medians_and_means(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            # Three portraits: insight scores 3, 4, 5; rest all 4
            for i, insight in enumerate([3, 4, 5], start=1):
                data = make_valid_rubric(insight=insight, portrait_id=f"p{i}")
                data["rubric_prompt_sha"] = "abc123" * 10 + "abcd"  # 64 chars
                data["overall_score"] = finalize.compute_overall_score(data["dimensions"])
                (tmp_path / f"p{i}.json").write_text(json.dumps(data))

            out_path = tmp_path / "corpus.json"
            rc = finalize.main(
                [
                    "aggregate",
                    str(tmp_path),
                    "--out",
                    str(out_path),
                ]
            )
            self.assertEqual(rc, 0)
            agg = json.loads(out_path.read_text())
            self.assertEqual(agg["portrait_count"], 3)
            # median insight = 4, mean = 4.0
            self.assertEqual(agg["medians"]["insight_beneath_observation"], 4)
            self.assertEqual(agg["means"]["insight_beneath_observation"], 4.0)
            # median of other dims should be 4
            self.assertEqual(agg["medians"]["voice"], 4)

    def test_aggregate_skips_raw_and_prior_corpus(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            data = make_valid_rubric()
            data["rubric_prompt_sha"] = "a" * 64
            data["overall_score"] = 4.0
            (tmp_path / "portrait1.json").write_text(json.dumps(data))
            # These should be skipped:
            (tmp_path / "portrait1.raw.json").write_text(json.dumps(data))
            (tmp_path / "2026-04-11-corpus.json").write_text('{"ignored": true}')

            out_path = tmp_path / "out.json"
            rc = finalize.main(["aggregate", str(tmp_path), "--out", str(out_path)])
            self.assertEqual(rc, 0)
            agg = json.loads(out_path.read_text())
            self.assertEqual(agg["portrait_count"], 1)

    def test_aggregate_fails_on_empty_directory(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            out_path = tmp_path / "out.json"
            rc = finalize.main(["aggregate", str(tmp_path), "--out", str(out_path)])
            self.assertEqual(rc, 1)


class TestCmdDiff(unittest.TestCase):
    def _make_aggregate(self, path: Path, medians: dict, sha: str = "a" * 64):
        agg = {
            "rubric_version": "1.0",
            "rubric_prompt_sha": sha,
            "timestamp": "2026-04-11T20:40:00+00:00",
            "portrait_count": 5,
            "results": [],
            "medians": medians,
            "means": medians,  # not used in diff
        }
        path.write_text(json.dumps(agg))

    def test_diff_no_regression(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            baseline_medians = {d: 4 for d in finalize.DIMENSIONS}
            baseline_medians["overall"] = 4.0
            current_medians = {d: 4 for d in finalize.DIMENSIONS}
            current_medians["overall"] = 4.0

            baseline_path = tmp_path / "baseline.json"
            current_path = tmp_path / "current.json"
            self._make_aggregate(baseline_path, baseline_medians)
            self._make_aggregate(current_path, current_medians)

            out_path = tmp_path / "diff.json"
            rc = finalize.main(
                [
                    "diff",
                    str(current_path),
                    str(baseline_path),
                    "--out",
                    str(out_path),
                ]
            )
            self.assertEqual(rc, 0)
            diff = json.loads(out_path.read_text())
            self.assertTrue(diff["passed"])
            self.assertEqual(diff["regressions"], [])

    def test_diff_detects_regression_exceeding_threshold(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            baseline_medians = {d: 4 for d in finalize.DIMENSIONS}
            baseline_medians["overall"] = 4.0
            # insight drops from 4 to 3.2 — delta -0.8, exceeds 0.5
            current_medians = {d: 4 for d in finalize.DIMENSIONS}
            current_medians["insight_beneath_observation"] = 3.2
            current_medians["overall"] = 3.9

            baseline_path = tmp_path / "baseline.json"
            current_path = tmp_path / "current.json"
            self._make_aggregate(baseline_path, baseline_medians)
            self._make_aggregate(current_path, current_medians)

            out_path = tmp_path / "diff.json"
            rc = finalize.main(
                [
                    "diff",
                    str(current_path),
                    str(baseline_path),
                    "--out",
                    str(out_path),
                ]
            )
            self.assertEqual(rc, 2)  # non-zero exit for regression
            diff = json.loads(out_path.read_text())
            self.assertFalse(diff["passed"])
            regressed_dims = {r["dimension"] for r in diff["regressions"]}
            self.assertIn("insight_beneath_observation", regressed_dims)

    def test_diff_respects_custom_threshold(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            baseline_medians = {d: 4 for d in finalize.DIMENSIONS}
            baseline_medians["overall"] = 4.0
            # Drop of 0.3 — does not exceed 0.5 default but exceeds 0.2
            current_medians = {d: 4 for d in finalize.DIMENSIONS}
            current_medians["voice"] = 3.7
            current_medians["overall"] = 4.0

            baseline_path = tmp_path / "baseline.json"
            current_path = tmp_path / "current.json"
            self._make_aggregate(baseline_path, baseline_medians)
            self._make_aggregate(current_path, current_medians)

            out_path = tmp_path / "diff.json"
            rc = finalize.main(
                [
                    "diff",
                    str(current_path),
                    str(baseline_path),
                    "--threshold",
                    "0.2",
                    "--out",
                    str(out_path),
                ]
            )
            self.assertEqual(rc, 2)
            diff = json.loads(out_path.read_text())
            self.assertFalse(diff["passed"])
            self.assertIn("voice", {r["dimension"] for r in diff["regressions"]})

    def test_diff_warns_on_sha_mismatch(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            medians = {d: 4 for d in finalize.DIMENSIONS}
            medians["overall"] = 4.0
            baseline_path = tmp_path / "baseline.json"
            current_path = tmp_path / "current.json"
            self._make_aggregate(baseline_path, medians, sha="a" * 64)
            self._make_aggregate(current_path, medians, sha="b" * 64)

            out_path = tmp_path / "diff.json"
            rc = finalize.main(
                [
                    "diff",
                    str(current_path),
                    str(baseline_path),
                    "--out",
                    str(out_path),
                ]
            )
            self.assertEqual(rc, 0)  # no regression despite sha mismatch
            diff = json.loads(out_path.read_text())
            self.assertIn("warning", diff)
            self.assertIn("different judge prompt", diff["warning"])


if __name__ == "__main__":
    unittest.main()
