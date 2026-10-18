# Interface system and verification

The design uses DM Sans for body text, Sora for headings, and the existing Kudex mark. Fonts are served locally with adjacent OFL licenses. Body copy is 16px with a 1.6 line height. The dark palette follows the product brief: obsidian canvas (#06080D), titanium surface (#0E121B), elevated surface (#161C2B), steel borders (#21293D), and emerald action accent (#00E599). Light mode uses blue-neutral surfaces with an accessible dark emerald action color. Semantic tokens in `globals.css` are the source of truth.

Landing-page hierarchy: product purpose, conceptual authorization flow, present capabilities, starting actions, future scope. Workspace hierarchy: Overview, Public vault, RFQ trading, Agents, User guide; unfinished workflows sit under In development. Status and empty states explain the next useful action rather than inventing balances or activity.

Motion is limited to a scoped hero entrance (opacity and 12px translation), menu entry, mobile drawer entry, and short control feedback. There is no looping ticker, financial animation, layout-width transition, or reveal of every scrolling section. Reduced-motion users receive static content. Theme changes disable transitions.

Dialogs use Radix focus management, Escape dismissal, and focus restoration. Dropdowns use Radix keyboard navigation and collision-aware portals without locking the entire page. Primary controls target at least 44px. Navigation and forms include accessible labels, visible focus, error alerts, and explicit result messages. Transaction review precedes wallet signing.

## Manual browser acceptance, still required

The initial pass used source review and builds. The later headless Chrome pass below adds rendered evidence. Actual wallet acceptance, funding and transaction signing still need end-to-end verification. Check the remaining conditions before release:

- 320px, 375px, 768px, and desktop widths: no horizontal page overflow; long addresses wrap; menus remain inside the viewport.
- Light, dark, and system themes; refresh with saved preference; readable focus and disabled states.
- Keyboard-only: skip links, header wallets, native account picker, mobile navigation, all agent fields, review/edit/export, vault review/cancel.
- Connect the actual Portaldot extension, accept/reject account access, select accounts, disconnect, and revoke site access. No native transaction support is implied.
- Check native-only and EVM-only wallets, wrong network, no gas, missing contracts, RPC failure, approval-only success, rejected deposit, and successful withdrawal.
- Toggle reduced motion before load; content remains visible and usable without entrance effects.
- Verify screen-reader names and announcements; inspect contrast and 200% zoom.
- With funded contracts: compare UI values and receipts to the live chain. Never replace errors with simulated success.

## October 17 second pass: rendered evidence

Headless Chrome became available through the repository's Playwright harness. The second pass captures `/`, `/app/agents`, and `/app/vaults` at 320px and 1280px in both light and dark themes, verifies the actual root theme class, records document overflow and JavaScript/request errors, and runs axe WCAG A/AA checks. Initial evidence is in `artifacts/ui/`; clearing captures are written separately to `artifacts/ui/verified/`.

The first matrix found one prohibited accessible label on a generic conversation div. It was changed to a named region. The matrix showed no horizontal page overflow. Final counts and keyboard/form-flow results are recorded in `artifacts/ui/verified/report.json` and the Playwright runner output after the clearing run.

Browser tests exercise native-account fixtures, focus restoration after wallet/mobile navigation dialogs, policy draft review/edit/export with activation unavailable, and chunked conversation rendering. Mock account and Gemini responses prove UI handling; they do not establish real wallet signing, provider access, or funding. Actual Portaldot extension acceptance and funded transaction flows still require user-side testing.

Clearing result: all 12 route/width/theme conditions had zero axe violations, no horizontal document overflow, and no recorded JavaScript or request failures. The three browser flow tests passed. The Google SDK tool-loop test uses a mock transport and checks tool dispatch, streamed text, and thought-signature preservation; it is not a live Google health result.

A scoped Overview rerun added four conditions after the telemetry change (`artifacts/ui/overview/report.json`), also with zero axe violations, document overflow, or recorded runtime/request errors. Total rendered coverage for this pass is 16 route/width/theme conditions across Home, Agents, Public vault and Overview.
