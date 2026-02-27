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

## Initial Setup Note (Bootstrapping)

> **If you encounter:** *"At least 1 approving review is required by reviewers with write access. Cannot update this protected ref."*

This error appears when branch protection is active and a PR has not yet received the required approval. It is expected behavior — direct pushes to `main` are blocked by design.

**For the very first PR that adds the `CODEOWNERS` file** (before it exists on `main`), GitHub cannot yet enforce the Code Owners review requirement because the file doesn't exist in the target branch. In this case:

1. The repository owner (`@osmtrntstn`) must **approve the PR** in the GitHub Pull Requests UI.
2. Once approved, the PR can be merged normally.
3. After the `CODEOWNERS` file is on `main`, all subsequent PRs will automatically require a review from `@osmtrntstn`.
