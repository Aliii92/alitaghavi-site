# Dubai Listing → Supabase → alitaghavi.ae

The source is the existing **Dubai Listing 0521366006** workbook. New Listing is not read or deleted. Apps Script sends a strict allowlist of property fields to `dubai-listing-sync`; the website already reads these Supabase tables. No Vercel redeploy is needed for subsequent listing changes.

## Activation

1. Apply `supabase/listing-sync.sql`. Deploy the Edge Function with gateway JWT verification disabled **only because the handler authenticates a dedicated 256-bit sync token**. Never use the Supabase service key in Sheets.
2. Generate a random 32-byte token. Store only its SHA-256 hex digest in `listing_sync_settings.token_hash`, with `enabled=true`. Keep the plaintext out of git, cells and logs.
3. Add `Website ID`, `نمایش در سایت`, `وضعیت همگام‌سازی` columns to each source tab. Seed existing IDs via `listing_sheet_records` only after unambiguous matching. Leave new/ambiguous rows unchecked for review. Palm Jumeirah needs its missing header row inserted without overwriting its first property.
4. In the source workbook's **Extensions → Apps Script**, add `DubaiListing.gs` and the manifest. Preserve unrelated existing scripts/triggers. Run `setupDubaiListingSync`, approve Google permissions and enter the dedicated token when prompted. The token is stored in Script Properties. Setup first verifies an actual sync, then installs a five-minute timer and an edit trigger.
5. Verify a real price change and an unticked row through the public site, then restore the intended values. Verify media and private contact fields are preserved/excluded. Do not report automatic sync active until Google authorization and this check succeed.

## Daily use

- Edit the existing workbook only. Tick `نمایش در سایت` to publish a row.
- Untick to hide a property; do this before deleting its row. Missing rows never delete stored properties.
- Never copy `Website ID` into a different unit. Blank IDs are generated automatically; duplicates abort the whole batch.
- `STATUS` is the construction/occupancy stage and `HANDOVER` also carries availability in this workbook. `Not Available`/`Sold` hides a row even if checked. Rented units with `Available` remain available for sale.
- Media, descriptions, featured flags and internal notes remain managed in the admin panel. Owner names, phone numbers, unit numbers, notes and media cells are never sent by the sync.
- New Listing can be retained as an archive until any external legacy automation is identified and disabled. No unrelated automation is removed automatically.

## Recovery

Run `stopDubaiListingSync` to remove only this integration's triggers. Set database `enabled=false` to immediately reject writes. Failed validation rolls back the whole batch; stale batches cannot overwrite newer data. Google trigger failures appear in Apps Script Executions and `LAST_SYNC_ERROR`; successful row feedback includes Dubai time. Check `listing_sync_settings.last_synced_at` for server confirmation.

The pre-existing exposed Supabase service key in repository history still requires rotation before production release. This integration does not resolve that separate credential incident.
