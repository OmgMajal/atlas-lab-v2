# Android app plan

## Path A — PWA first

Open the protected Atlas URL in Android Chrome, open the browser menu, choose **Install app** or **Add to Home screen**, and then launch Atlas from the home screen. The PWA uses a standalone window and caches the offline shell. Browser-stored drafts remain on that device only.

## Path B — wrapper later

After server-side authentication and a real backend exist, evaluate Capacitor or a Trusted Web Activity. A wrapper needs the existing app icons, splash artwork, Android package identity, release signing, update handling, privacy disclosures, network/offline policy, and Play Store review. Do not publish an Android wrapper for financial use until authentication, authorization, encrypted server storage, audits, and support processes are production-ready.

The app does not request camera, microphone, location, payments, or other Android permissions. There is no multi-device sync and no claim of offline server reconciliation.
