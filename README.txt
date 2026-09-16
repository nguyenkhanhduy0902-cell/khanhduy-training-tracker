KHANHDUY TRAINING TRACKER V5.1 - CLOUD SYNC

FILES TO UPLOAD TO GITHUB REPOSITORY ROOT:
- index.html
- manifest.webmanifest
- sw.js
- icon-192.png
- icon-512.png
- .nojekyll

SUPABASE SETUP:
1. Create a Supabase project.
2. Open SQL Editor and run supabase_setup.sql.
3. In Supabase, copy Project URL and Publishable key (NOT secret/service_role key).
4. Open the app > Du lieu > Dong bo Cloud.
5. Paste URL + Publishable key, then save.
6. Create/login with email + password.
7. FIRST TIME: on the PC that already contains your correct data, click "Day may nay len cloud".
8. On phone, configure/login with the same account, then click "Tai cloud ve may".
9. Leave Auto Sync enabled.

IMPORTANT:
- Do not edit both devices at exactly the same time. The app detects common conflicts and asks which copy to keep.
- Keep periodic JSON backups.

V5.1 CHANGES:
- Tab title updated to V5.1.
- Signup confirmation emails explicitly redirect to the GitHub Pages app.
- Added 'Gui lai email xac nhan' button.
- Confirmation redirect can restore the Supabase session automatically when tokens are returned.
