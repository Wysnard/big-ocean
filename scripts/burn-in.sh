#!/usr/bin/env bash
set -euo pipefail

iterations="${BURN_IN_ITERATIONS:-10}"

if ! [[ "$iterations" =~ ^[0-9]+$ ]] || [ "$iterations" -lt 1 ]; then
	echo "[burn-in] BURN_IN_ITERATIONS must be a positive integer"
	exit 1
fi

if [ ! -f ".env.e2e" ]; then
	echo "[burn-in] .env.e2e is required for Playwright burn-in"
	exit 1
fi

echo "[burn-in] Running Playwright burn-in for $iterations iterations"

for iteration in $(seq 1 "$iterations"); do
	echo "[burn-in] Iteration $iteration/$iterations"
	pnpm --filter=@workspace/e2e exec playwright test
done

echo "[burn-in] Completed $iterations successful iterations"
