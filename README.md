# Tandem Office

Audio-only virtual office for the Tandem team. Spec: `docs/SPEC.md`.

## Run locally
```
npm install
cp .env.example .env    # fill in the Supabase URL + publishable key
npm run dev
```

## One-time setup (Rob)
1. Run `supabase/migrations/20261106_office_messages.sql` on the cockpit Supabase project (SQL editor). Until then chat is live-only: no history, no vault export.
2. Vault export every 30 minutes:
   ```
   sed "s#/Users/YOUR-USER#$HOME#g" scripts/com.tandem.office-log.plist > ~/Library/LaunchAgents/com.tandem.office-log.plist
   launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.tandem.office-log.plist
   ```
   Writes `co-owned/office/log/YYYY-MM-DD.md` in the synced TeamOS library. Run by hand: `node scripts/export-office-log.mjs`.
3. Deploy: every push to `main` deploys to https://rob-tandem.github.io/tandem-office/ via `.github/workflows/pages.yml`.
