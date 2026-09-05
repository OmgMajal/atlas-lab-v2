# Cloudflare Pages deployment

Atlas is a static, browser-only prototype. Deploy it only as a protected staging/private beta or as a fictional public demo. It is not a production financial system and the in-app demo login is not internet security.

## Pages configuration

Connect the GitHub repository to Cloudflare Pages. Use `main` only for the protected baseline; use `feature/atlas-online-mobile-deployment` (or a reviewed merge of it) as the preview branch. There is no build command and the output directory is the repository root. Cloudflare Pages must publish `_redirects` and `_headers` with the static files.

Use a protected staging hostname such as `staging-atlas.example.com`. Add Cloudflare Access before exposing this hostname: allow only owner/developer/tester email identities, use one-time PIN or an approved identity provider, set a short session duration, and do not add bypass rules except a documented emergency owner path. The browser demo login remains a second demo-only screen, never the access control layer.

For a public demo, deploy a separate Pages project or branch at `atlas-demo.example.com`. It must contain fictional data only and show the Public Demo banner. Do not use a protected-staging deployment as a public demo.

## HTTPS, cache, and routes

Cloudflare Pages supplies HTTPS once the domain is connected. `_redirects` rewrites client-facing paths such as `/calculator`, `/odds-intelligence`, `/settings`, and `/reports` to the static entry page. `_headers` applies defensive static headers; this prototype uses inline scripts, so a strict CSP is deliberately deferred until the scripts are externalized and tested.

## Environment variables and secrets

This static prototype consumes no deployment secrets. Never place API keys, Cloudflare tokens, betting/platform credentials, real data, or Access bypass tokens in frontend files or Pages variables exposed to the browser.

## Rollback

Rollback in Cloudflare Pages to the previous successful deployment, or revert the deployment commit and redeploy. If a service-worker cache issue occurs, deploy a new versioned worker, ask testers to refresh once, and only then retire the old deployment. Disable the Access application or remove the public custom domain to stop exposure immediately.
