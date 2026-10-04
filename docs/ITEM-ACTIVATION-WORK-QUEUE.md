# Cultivation Foundations Item Activation Work Queue

The assessment candidate bank already satisfies the machine construction minimum of **15 candidate summative/credential items per competency**. That is deliberately separate from the operational active-item requirement.

Use:

```
npm run itembank:activation:queue
npm run itembank:activation:queue -- --json
```

The report computes, from the live question files:

- candidate count per blueprint competency;
- active count per competency;
- deficit to the 15-active-item minimum;
- current item-status distribution;
- exact candidate item IDs available for the next activation tranche;
- the evidence required before any item may count as active.

## Activation sequence

An item must not be changed to `active` merely to satisfy the numerical minimum. For the exact item version, preserve:

1. human assessment-review approval;
2. controlled pilot evidence;
3. documented disposition of review/pilot findings;
4. controlled status transition with prior evidence preserved;
5. secure operational-store boundary before credential use.

This queue therefore converts `minimumActivePoolComplete=false` from a vague blocker into a deterministic worklist without weakening the assessment-validity gate.
