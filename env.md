# List of environment variables

## App

- **(REQUIRED)**`NODE_ENV` *(string)*  
  Supported values: `production` | `test` | `development`

- `APP_VERSION` *(string)*  
  Default: `unknown`

## App Listen

- **(REQUIRED)**`PORT` *(integer)*  
  Application listening port  
  Minimum: `1024`  
  Maximum: `65535`

- `HOST` *(string)*  
  Bind host address  
  Default: `0.0.0.0`

## Database

- **(REQUIRED)**`DATABASE_URL` *(string)*  
  PostgreSQL connection URL  
  Format: `uri`

- `DB_POOL_SIZE` *(integer)*  
  Database connection pool size  
  Default: `10`  
  Minimum: `1`  
  Maximum: `100`

## Api

- **(REQUIRED)**`API_KEY` *(string)*  
  Third-party API authentication key  
  Min length: `32`
