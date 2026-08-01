# Atlas Appearance and Branding System

## Architecture

Atlas remains a static HTML, CSS, and JavaScript application. Appearance data is
stored beside the existing local Atlas state, but it is kept in separate
collections and never mixed into Ledger, Calculator, settlement, Client, or
financial records.

- `atlas-theme-service.js` owns theme schemas, presets, validation, permissions,
  versions, activation, rollback, import, export, and personal preferences.
- `atlas-appearance-controller.js` owns the protected Appearance workspace,
  isolated preview, branding files, and Owner/Admin interactions.
- `styles.css` consumes centralized semantic CSS variables.
- `app.js` exposes a small appearance bridge and applies the active validated
  theme. Financial services are not referenced by the Theme service.

The safe `Atlas Clean Financial` preset is loaded before the main stylesheet.
When persisted appearance data is missing or invalid, Atlas applies this preset
and continues loading the operational application.

## Stored Data

The local state contains:

- `themes`: profile metadata.
- `themeVersions`: immutable token, branding, workspace, status, and audit
  snapshots.
- `activeThemes`: the globally active and previous version references.
- `appearancePermissions`: Owner-granted Admin capabilities.
- `userAppearancePreferences`: personal mode, density, Sidebar, and motion.
- `appearancePolicies`: Admin approval and personal-preference policy.

No database migration is required for this build. `normalizeState` adds these
collections to existing Atlas backups and preserves all historical records.

## Semantic Tokens

Tokens are defined once in `TOKEN_DEFINITIONS`. Categories include:

- Global colors and text-on-action colors
- Surfaces, borders, statuses, and table states
- Sidebar and Header presentation
- Body, heading, and numeric typography
- Shape, density, spacing, and control dimensions
- Calculator grid, frozen columns, Event headers, locked/editable cells,
  Cash, Bonus, Free Bet, warning, and completion states
- Workspace and motion modes

Legacy Atlas CSS variables are aliases to the semantic values during migration.
New shared component rules use semantic tokens directly.

## Built-In Presets

1. Atlas Clean Financial
2. Minimal Accounting
3. Fintech Blue
4. Executive Dark
5. High Contrast
6. Custom

Built-in versions cannot be edited, archived, or deleted. They can be
duplicated into a custom Draft.

## Permissions

The Owner always has full Appearance access. Admins have no access by default.
The Owner may grant these capabilities independently:

- View
- Edit
- Manage Branding
- Import
- Export
- Activate
- Reset and rollback

`manageAppearance` is true only when an Admin has both View and Edit access.
Shareholders cannot view or edit global Appearance data. Personal preferences
are available only when the Owner policy allows them.

The static build enforces these permissions in navigation, route selection, and
every local Theme service action. A future server must repeat the same checks at
API and database boundaries.

## Draft, Approval, and Activation

The workflow is:

`Draft -> Preview -> Validate -> Save Version -> Submit -> Approved -> Active`

Admin submissions become `Pending Approval` while the default Owner-approval
policy is enabled. The Owner records an approval or rejection note. Only one
global version is Active. The previous active version is retained for rollback.

Every save creates a new version. Existing versions are never overwritten.
Version comparison lists changed tokens and branding fields without displaying
image binary data.

## Live Preview

The preview has Dashboard, Accounting, and Calculator workspaces plus Desktop,
Tablet, and Mobile sizes. Draft variables are scoped to the preview container,
so unsaved values cannot affect the live application.

## Accessibility

Activation checks critical WCAG contrast pairs:

- Page, card, and secondary text
- Primary action text
- Sidebar and active navigation
- Table headers
- Warning and danger states
- Calculator values

Critical failures block activation. Focus indicators, labels, non-color status
text, reduced motion, table headers, mobile access, and intentional dark tokens
are preserved.

## Import and Export

Theme JSON contains only Theme metadata, versioned tokens, branding, workspace
settings, schema version, and compatibility version. It excludes Client data,
financial data, credentials, access tokens, and private application state.

Import rejects:

- Unknown tokens
- Invalid colors or numeric ranges
- Raw CSS
- JavaScript and HTML execution patterns
- `url()`, external styles, and unsafe URLs
- Unsupported future application versions
- Unsupported image data

Imported themes are always Drafts and are never automatically activated.

## Branding Safety

The first implementation accepts local PNG, WebP, and ICO data images up to
1 MB per field. SVG is intentionally disabled because this static build has no
trusted server-side SVG sanitizer. Raw URLs and external font files are not
accepted.

Branding cannot remove the signed-in user, role, Client context, financial
warnings, or authorization controls.

## Adding a Token

1. Add the token and validator to `TOKEN_DEFINITIONS`.
2. Add a safe value to `CLEAN_TOKENS`.
3. Add intentional values to presets when required.
4. Add the token to a Theme Builder section in
   `atlas-appearance-controller.js`.
5. Consume its semantic CSS variable in `styles.css`.
6. Add validation and contrast coverage where the token affects readability.

## Adding a Component Variant

Use existing semantic variables rather than a raw color or shadow. Define the
variant next to the shared Button, Card, Table, Badge, Input, Dialog, or
Calculator rules. Add it to the isolated preview when the variant has a new
visual or accessibility behavior.

## Limitations

This Atlas build has no backend, shared database, object storage, or API.
Therefore it cannot provide true server-side authorization, transactional Theme
publishing, multi-user concurrency, server-side file scanning, or database row
policies. The local service mirrors the required rules and fails closed, but a
production deployment must revalidate every Theme action on a trusted server.

Visual regression is performed through representative live browser checks
rather than a Storybook or screenshot-baseline framework because this static
project does not include a component test runner.
