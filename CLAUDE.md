## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- NEVER use the Grep tool or `grep`/`rg` in Bash to explore the codebase. Always use `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<node>"` instead — these traverse the graph's EXTRACTED + INFERRED edges rather than scanning files
- Only use Read on a specific known file path after graphify has told you where to look
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
