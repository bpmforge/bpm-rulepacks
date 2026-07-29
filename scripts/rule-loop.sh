#!/usr/bin/env bash
# The build loop. Same job, one defect at a time, until the queue is empty.
#
#   scripts/rule-loop.sh sampleco        # until no misses remain
#   scripts/rule-loop.sh sampleco 3      # at most 3 iterations
#
# This script is the HARNESS, not the worker: it measures, decides whether to
# continue, and refuses to let an iteration claim success it cannot demonstrate.
# The per-iteration work (diagnose → fixture → RED → fix → GREEN) is done by an
# agent invoked with docs/RULE_LOOP.md as its brief; see AGENT_CMD below.
#
# WHY A HARNESS AT ALL, rather than just asking for "fix all the misses":
# every guard here exists because the corresponding failure has happened.
#   - coverage is re-measured after every iteration, so a fix that does not
#     move ground truth is reported as a STALL rather than counted
#   - the other corpora are gated every iteration, so recall bought with false
#     positives is caught in the iteration that bought it, not five later
#   - baselines are never written by this loop
set -uo pipefail

CORPUS="${1:?usage: rule-loop.sh <corpus> [max-iterations]}"
MAX="${2:-25}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

# The worker. Override to plug in a different agent runner; it receives the
# brief on stdin and is expected to leave the working tree with the fix applied.
AGENT_CMD="${RULE_LOOP_AGENT:-}"

covered_now() {
  node scripts/score-corpus.mjs "$CORPUS" --emit /tmp/rule-loop-$$.json >/dev/null 2>&1
  node -e 'const r=require("/tmp/rule-loop-'$$'.json");console.log(`${r.covered} ${r.total}`)' 2>/dev/null || echo "0 0"
}

read -r START_COVERED TOTAL <<<"$(covered_now)"
echo "rule-loop: $CORPUS at $START_COVERED/$TOTAL covered"
echo

i=0
stalls=0
while [ "$i" -lt "$MAX" ]; do
  read -r covered total <<<"$(covered_now)"
  if [ "$covered" = "$total" ] && [ "$total" != "0" ]; then
    echo "rule-loop: every label covered ($covered/$total). Done."
    break
  fi

  i=$((i + 1))
  echo "──────── iteration $i  ($covered/$total covered) ────────"
  npm run --silent misses -- "$CORPUS" --one

  if [ -z "$AGENT_CMD" ]; then
    echo "rule-loop: no worker configured (set RULE_LOOP_AGENT)."
    echo "rule-loop: the defect above is the next unit of work — see docs/RULE_LOOP.md steps 3-8."
    exit 0
  fi

  npm run --silent misses -- "$CORPUS" --one --json > /tmp/rule-loop-task-$$.json
  if ! $AGENT_CMD < /tmp/rule-loop-task-$$.json; then
    echo "rule-loop: worker failed on iteration $i — stopping rather than looping on a broken step."
    exit 1
  fi

  # Did ground truth actually move? A fixture passing is not coverage.
  read -r after _ <<<"$(covered_now)"
  if [ "$after" -le "$covered" ]; then
    stalls=$((stalls + 1))
    echo "rule-loop: STALL — coverage still $after/$total after iteration $i."
    echo "rule-loop:   The fixture may pass while the real defect is still missed (step 7)."
    if [ "$stalls" -ge 2 ]; then
      echo "rule-loop: two consecutive stalls. Stopping — the loop is not converging."
      exit 1
    fi
    continue
  fi
  stalls=0
  echo "rule-loop: coverage $covered -> $after"

  # Every iteration pays for itself or it does not land.
  if ! node scripts/gate-corpus.mjs juice-shop ossf-cve-benchmark owasp-benchmark-java; then
    echo "rule-loop: BLOCKED — iteration $i regressed another corpus. Recall bought with false positives."
    exit 1
  fi
  echo
done

read -r END_COVERED _ <<<"$(covered_now)"
rm -f /tmp/rule-loop-$$.json /tmp/rule-loop-task-$$.json
echo
echo "rule-loop: $CORPUS $START_COVERED/$TOTAL -> $END_COVERED/$TOTAL over $i iteration(s)"
[ "$i" -ge "$MAX" ] && echo "rule-loop: hit the $MAX-iteration cap — misses may remain (npm run misses -- $CORPUS)"
exit 0
