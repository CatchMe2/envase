# Changesets

This folder contains changeset files that describe changes to the package.

## How to use changesets

When you make a change that should be released, create a changeset:

```bash
pnpm changeset
```

This will prompt you to:

1. Choose the semver bump type (major, minor, or patch)
2. Write a summary of the change

Commit the changeset along with your code changes.

## Automated Releases

The Publish GitHub Actions workflow automatically:

- Creates a release PR when changesets are pushed to main
- Publishes the package to npm when the release PR is merged
- Creates a GitHub release with release notes
