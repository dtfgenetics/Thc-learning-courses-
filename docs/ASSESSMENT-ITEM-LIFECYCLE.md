# Assessment item lifecycle promotion

Assessment review, pilot evidence, and production activation are separate gates.

Use `scripts/promote-assessment-item.mjs` to preview a transition. The command is intentionally non-mutating unless both `--write` and `--confirm` are supplied.

## Move an approved item into pilot

A transition to `pilot` requires:
- an approved assessment review for the exact item version; and
- a non-invalidated pilot-evidence record for the exact item version.

Preview:

```bash
node scripts/promote-assessment-item.mjs --item=ITEM-... --to=pilot
```

Apply only after reviewing the preview:

```bash
node scripts/promote-assessment-item.mjs --item=ITEM-... --to=pilot --write --confirm
```

## Move a piloted item to active

A transition to `active` requires:
- an approved assessment review for the exact item version; and
- a `complete` pilot-evidence record for the exact item version.

The tool will not activate a flagged or retired item and will not use pilot evidence from a different item version.

After any lifecycle write, run `npm run pilot:validate` and the complete `npm test` suite before merging. Active status does not by itself publish a course or credential; release checks still require the published course/assessment chain and all production infrastructure gates.
