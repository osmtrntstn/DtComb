# Contributing Guide

## Branch Protection & Review Policy

- **Direct push to `main` is not allowed.**
- All changes must be submitted via a **Pull Request (PR)**.
- Every PR requires **at least 1 approval** before merging.
- The required reviewer is **@osmtrntstn** (enforced via [CODEOWNERS](.github/CODEOWNERS)).

## GitHub Branch Protection Rule Setup

To enforce these rules, a repository administrator must configure the branch protection rule in **Settings → Branches → Branch protection rules** for the `main` branch with the following options checked:

- ✅ **Require a pull request before merging**
  - ✅ **Require approvals** (set minimum to **1**)
  - ✅ **Require review from Code Owners**
- ✅ **Do not allow bypassing the above settings** *(also applies to administrators)*

## Contribution Workflow

1. Create a new branch from `main`.
2. Make your changes and push your branch.
3. Open a Pull Request targeting `main`.
4. Wait for a review and approval from **@osmtrntstn**.
5. Once approved, the PR can be merged into `main`.
