---
"envase": major
---

Report a validation error when an empty or whitespace-only envvar is coerced to `0` (e.g. `z.coerce.number()` with `PORT=`), instead of silently resolving it to `0`.
