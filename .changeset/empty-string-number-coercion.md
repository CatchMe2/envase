---
"envase": patch
---

Report a validation error when an empty envvar is coerced to `0` (e.g. `z.coerce.number()` with `PORT=`), instead of silently resolving it to `0`.
