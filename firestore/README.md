# Firestore extras: approved answers and feedback

Off by default. The database is shared with Kishore.OS, so nothing here is deployed automatically.

1. Copy the `answers` and `feedback` blocks from `firestore.rules` into `portfolio-os/firestore.rules`.
2. Deploy them once from there: `firebase deploy --only firestore:rules`.
3. Set `FIRESTORE_EXTRAS = true` in `src/app/core/site.config.ts` and deploy the site.

**Approve an answer:** in the console, add a document to `answers` with
`q` (the question in lower case, without punctuation at the end, single spaces), `answer` (text) and `approved` (true).

**Read feedback:** open the `feedback` collection in the console. It holds the question and answer the visitor rated.
