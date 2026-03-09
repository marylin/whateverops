#!/bin/bash
# Record a demo GIF of the WhateverOPS dashboard
# Requires: vhs (https://github.com/charmbracelet/vhs) or manual screen recording
#
# Usage:
#   1. Start the app: pnpm dev
#   2. Configure at least a few integrations in .env
#   3. Run this script: bash scripts/record-demo.sh
#   4. Or manually record with any screen recorder

echo "=== WhateverOPS Demo Recording ==="
echo ""
echo "Option 1: Manual recording"
echo "  1. Open http://localhost:5173 in a browser"
echo "  2. Use any screen recorder (OBS, Kap, LICEcap)"
echo "  3. Record for ~10 seconds showing all panels"
echo "  4. Save as docs/assets/demo.gif"
echo ""
echo "Option 2: Playwright screenshot (static)"
echo "  npx playwright screenshot --full-page http://localhost:5173 docs/assets/demo.png"
echo ""

mkdir -p docs/assets
echo "Created docs/assets/ directory for demo media."
