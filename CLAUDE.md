## graphify

This project has a knowledge graph at `graphify-out/`. Always use it — it provides ~71x fewer tokens than reading files directly.

### Query order (strict)
1. Read `graphify-out/GRAPH_REPORT.md` **once per session** for god nodes and community structure
2. `graphify query "<question>"` — semantic search, always start here
3. `graphify explain "<NodeName>"` — deep dive on a specific node or concept
4. `graphify path "<A>" "<B>"` — trace how two concepts connect
5. `Read` only after graphify has given you a specific file path — never to explore

### Hard rules
- NEVER use Grep, `grep`, `rg`, `find`, or any file scan to explore the codebase
- NEVER read a file to understand architecture — always query the graph first
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` (AST-only, no API cost)
