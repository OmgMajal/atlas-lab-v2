# Deployment checklist

- [ ] `node tests/run-all.js` passes.
- [ ] Preview is deployed from a reviewed branch.
- [ ] Only fictional/demo data is present.
- [ ] Protected staging has Cloudflare Access and approved email identities.
- [ ] Public demo, if used, is a separate deployment and shows its demo banner.
- [ ] HTTPS and custom domain are active.
- [ ] `_headers` and `_redirects` are deployed.
- [ ] Direct paths load correctly.
- [ ] PWA manifest, icons, service worker, and offline page work.
- [ ] Mobile checks pass at 360x740, 390x844, 412x915, 768x1024, 1024x1366, and desktop.
- [ ] Calculator drafts persist on mobile.
- [ ] Odds Intelligence is visible only when its feature flag is enabled.
- [ ] No real provider calls, secrets, private notes, or private exports are exposed.
- [ ] A previous Pages deployment is available for rollback.
