#!/usr/bin/env bash
set -euo pipefail

MODEL="octave"
VOICE="David5"

while IFS=, read -r YEAR ID TEXT_PATH WAV_PATH MP3_PATH; do
  if [[ "$YEAR" == "year" ]]; then continue; fi
  echo "Rendering $YEAR/$ID"
  # Requires: npm i -g @humeai/cli and hume login (or HUME_API_KEY env)
  # Generate MP3s directly into the mp3 directory with the exact target name
  OUT_DIR_MP3=$(dirname "$MP3_PATH")
  PREFIX_MP3=$(basename "$MP3_PATH" .mp3)
  # Skip if already exists
  if [ -f "$MP3_PATH" ]; then
    echo "✓ exists: $MP3_PATH"
    continue
  fi
  if [ -n "$HUME_API_KEY" ]; then
    if ! hume tts "$(cat "$TEXT_PATH")"       --voice-name "$VOICE"       --output-dir "$OUT_DIR_MP3"       --prefix "$PREFIX_MP3"       --play off       --format mp3       --api-key "$HUME_API_KEY"; then
      echo "! failed: $YEAR/$ID" >&2
      continue
    fi
  else
    if ! hume tts "$(cat "$TEXT_PATH")"       --voice-name "$VOICE"       --output-dir "$OUT_DIR_MP3"       --prefix "$PREFIX_MP3"       --play off       --format mp3; then
      echo "! failed: $YEAR/$ID" >&2
      continue
    fi
  fi
  # If the CLI added suffixes, normalize filename to the exact expected path
  if [ ! -f "$MP3_PATH" ]; then
    CAND=$(ls "$OUT_DIR_MP3"/"$PREFIX_MP3"* 2>/dev/null | head -n 1 || true)
    if [ -n "$CAND" ] && [ "$CAND" != "$MP3_PATH" ]; then
      mv -f "$CAND" "$MP3_PATH"
    fi
  fi
done < "/Users/davidsteuer/Documents/GitHub/bd49060825/scripts/hume-cli-plan.csv"
