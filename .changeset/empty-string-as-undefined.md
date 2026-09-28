---
"envase": minor
---

Add `emptyStringAsUndefined` option to `parseEnv` and `createConfig` that treats empty envvars as missing, so `.default()` and `.optional()` apply to them.
