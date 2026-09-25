---
"envase": patch
---

Treat an empty envvar that a schema coerces to `0` (e.g. `z.coerce.number()` with `PORT=`) as missing, so `.default()` and `.optional()` apply and required envvars fail validation instead of silently resolving to `0`.
