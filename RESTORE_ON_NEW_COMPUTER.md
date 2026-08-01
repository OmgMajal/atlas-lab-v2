# Restore Atlas Lab V2 on a New Windows Computer

## 1. Install prerequisites

Install Git and Node.js 18 or newer. Node.js 20+ is recommended. Use a modern browser.

Verify them in PowerShell:

```powershell
git --version
node --version
npm --version
```

## 2. Authenticate with GitHub

Use GitHub Desktop, Git Credential Manager, or GitHub CLI. For GitHub CLI:

```powershell
gh auth login
gh auth status
```

If `gh` is not installed, use GitHub Desktop or install the GitHub CLI from the official GitHub site.

## 3. Clone the private repository

Replace the placeholder with the private repository URL created for this project:

```powershell
git clone https://github.com/<your-private-account>/atlas-lab-v2.git
cd atlas-lab-v2
```

## 4. Restore local configuration

Create the environment file:

```powershell
copy .env.example .env
```

No values are currently required. Do not copy credentials into the repository. If a later backend introduces variables, restore them through a secure password manager or secret store.

## 5. Restore local Atlas and Lab data

The repository contains only fictional seeded demo data. To restore personal Lab work from the old computer:

1. Open the old Lab in the browser.
2. Sign in as Owner.
3. Use the top-bar **Export Data** action to download the unified Atlas state.
4. Open `Atlas Lab V2` -> `Administration` and use **Export Lab Backup**.
5. Transfer both JSON files through a secure private channel, not GitHub.
6. On the new computer, use top-bar **Import Data** for the Atlas backup.
7. Use Administration **Import Lab Backup** for the Lab backup.

Do not transfer browser cookies, session files, real passwords, or production exports through Git.

## 6. Start the application

```powershell
node serve-local.js
```

Open:

```text
http://127.0.0.1:4190/
```

Demo access:

- Owner: `owner` / `owner123`
- Admin: `admin` / `admin123`
- Shareholder: `shareholder` / `client123`

These are fictional test credentials only.

## 7. Run checks

```powershell
node tests\run-all.js
```

## 8. Verify production packaging locally

This repository has no framework build step. Confirm the server returns the Lab page, sign in, open Operations, Finance, Risk, Intelligence, and Administration, and verify that the `TEST ENVIRONMENT` badge is visible.

## 9. Continue development with Codex

Open the cloned repository root in Codex. Ask Codex to read `README.md`, `PROJECT_HANDOFF.md`, `RESTORE_ON_NEW_COMPUTER.md`, and the latest Git history before making changes. Keep all experimental changes in this private Lab repository until they are reviewed for production migration.
