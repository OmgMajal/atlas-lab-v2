# Atlas Lab V2 Restoration Manifest

## Verified recovery source

- Archive: `atlas-lab-v2-transfer-backup-2026-08-01.zip`
- Archive SHA-256: `afc9d7d034269b7b8469a7bd5acf7adc6d12de73e5044701f8109d3b5a6b757c`
- Restored and inspected: 2026-08-07
- Stable branch: `main`
- Recovery commit: `9827dc5fc87f71bc5252ea1d87c351d084028d2d`
- Recovery tag: `transfer-backup-v1`
- Git integrity: `git fsck --no-dangling` passed
- Included checks: passed on 2026-08-07

No absolute device paths, credentials, browser data, or private operational data
are recorded in this manifest.

## Runtime

- Required runtime: Node.js 18 or newer
- Full test command: `node tests/run-all.js`
- Start command: `node serve-local.js`
- Local URL: `http://127.0.0.1:4190/`

## External state

The source archive intentionally excludes browser profiles, localStorage dumps,
private exports, customer records, and credentials. Development after restoration
uses fictional seed/demo data only.

The recovery commit and tag must not be rewritten. A repository remote must be
explicitly verified before any tag or branch is reported as pushed.
