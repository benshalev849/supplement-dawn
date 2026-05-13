## Discount display logic

### Principle
Real discounts are applied by apps/Shopify, never by theme code:
- **Appstle / selling plans** → subscription discount
- **Shopify discount app** → volume discount
- **SMART** → Pair & Save / add-on bundle discount

Theme Liquid/JS must only calculate **display text, estimated prices, badges, and UI labels**. Never implement real discount logic in the theme.

### Discount values
Pull from Bloomli global theme settings first; product metafields are optional overrides.

| Type | Rate |
|---|---|
| Subscription | 15% |
| Volume — 1 pack | 0% |
| Volume — 2 pack | 10% |
| Volume — 3 pack | 15% |
| Volume — 4 pack | 18% |
| Volume — 5+ pack | 20% |
| Pair & Save / add-on bundle | 15% |

### Compounding formula
Discounts **compound**, they do not add.

```
final_discount = 100 - ((100 - volume%) * (100 - subscription%) * (100 - bundle%) / 10000)
```

Use 0 for any discount that does not apply.

Examples:
- 15% volume + 15% subscription → **27.75%**, not 30%
- 15% subscription + 20% Pair & Save → **32%**, not 35%
- 15% volume + 15% subscription + 20% Pair & Save → **42.2%**, not 50%

### Display rules by context

**BUY X SAVE Y buttons**
- One-time item → volume discount only
- Subscription item → volume + subscription compounded
- Add-on with supplement in cart → include Pair & Save if applicable

**Subscription upsell card**
- Show the extra subscription benefit only, e.g. "Subscribe & Save 15%"
- Do not show total compounded savings unless copy explicitly says "total savings"

**Delivery/frequency row**
- Show subscription-only savings, e.g. "SAVE 15%"

**Routine / add-on upsell**
- Price and copy must match exactly
- Do not estimate discounts that will not actually apply after add-to-cart
- If uncertain, show no estimated price rather than a wrong one

**Existing cart line prices**
- Always use real Shopify cart values: `item.final_line_price`, `item.original_line_price`, `item.line_level_discount_allocations`
- Never replace real cart line prices with theme math

### Rounding for estimated display prices
1. Calculate discounted unit price
2. Round to cents
3. Multiply by quantity

Do not calculate a discounted line total first — that can cause cent mismatches vs Shopify.

### Label discipline
Before adding any new discount UI, decide what it means:
- current active savings
- extra savings from upgrading
- total compounded savings
- retail compare-at savings

Calculate and display only that one meaning. Never mix them.

---

## Liquid section standards

- Every custom Liquid section must be customizable through the Shopify theme editor
- Add schema settings for: text/headings, images, spacing, enable/disable toggles, layout options, and section-specific overrides
- Avoid hardcoded copy — use schema defaults as fallbacks
- Avoid hardcoded product handles — prefer product pickers, tags, or metafields

---

## Liquid coding standards

- Use `{% render %}` not `{% include %}` — isolated scope, no variable leakage, ~20% faster
- Use `image_tag` + `image_url` filters for all images — handles responsive markup, lazy loading, and format selection (AVIF/WebP) automatically
- Hero / LCP images: add `fetchpriority: 'high'`, never lazy-load
- Below-fold images: add `loading: 'lazy'` and always include `width` and `height` to prevent layout shift
- Move filters outside loops — filter cost multiplies inside iterations
- Never hardcode block IDs — they are dynamically generated
- Use `paginate` for collections or arrays over 50 items
- Wrap block content in a parent element with `{{ block.shopify_attributes }}` for theme editor support
- Use `enabled_on` / `disabled_on` in section schema to restrict sections to appropriate templates
- Use `visible_if` in schema settings to show/hide settings conditionally
- Use `color_scheme` input type (not `color`) in schema — inherits from global theme settings
- Run Theme Check (`shopify theme check`) before deploying any Liquid changes

---

## CSS & JS standards

- All CSS and JS must live in the `assets/` directory — never inline styles or scripts in section/snippet files beyond what Shopify's section rendering requires
- Scope CSS to the section or snippet using a unique class prefix — do not write global selectors
- Defer or lazy-load non-critical JS; minimize custom JS overall
- Do not duplicate styles already provided by Dawn's base CSS

---

## Color / theme standards

- Use `color_scheme` setting and apply it as `class="color-{{ section.settings.color_scheme }} gradient"`
- Use theme color variables for background, text, borders, and buttons by default
- Do not hardcode Bloomli pink/cream/charcoal unless a setting explicitly calls for custom colors
- If custom colors are added, make them optional with a fallback to the active color scheme
- Keep CSS scoped to the section/snippet — do not leak styles to other theme areas

---

## graphify

This project has a knowledge graph at `graphify-out/`. Always use it — it provides ~71x fewer tokens than reading files directly.

### Query order (strict)
1. Read `graphify-out/GRAPH_REPORT.md` **once per session** for god nodes and community structure
2. `graphify query "<question>"` — semantic search, always start here
3. `graphify explain "<NodeName>"` — deep dive on a specific node or concept
4. `graphify path "<A>" "<B>"` — trace how two concepts connect
5. Read only after graphify has given you a specific file path — never to explore

### Hard rules
- NEVER use grep, rg, find, cat, head, tail, ls, or any shell file scan to explore the codebase
- NEVER parse `graph.json` directly with Python, networkx, or any script — use `graphify query`/`explain`/`path` CLI commands only
- NEVER read a file to understand architecture — always query the graph first
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` (AST-only, no API cost)
