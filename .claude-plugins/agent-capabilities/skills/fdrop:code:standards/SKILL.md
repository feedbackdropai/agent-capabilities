---
name: fdrop:code:standards
description: Shared conventions for building new features. Use when implementing a feature that spans multiple packages or has no package-specific skill.
allowed-tools: Read
---

# Code Standards

Follow the rules in the linked docs — they're requirements, not suggestions. Consistency is what keeps the codebase predictable to edit, for agents and humans alike.

## When to Use

Use this skill as the entry point when:
- Implementing a feature that spans multiple packages.
- Working in a package that has no dedicated package-specific skill.
- Unsure which standards apply — this skill tells you which child skills to load.

## Precedence

When rules conflict, apply them in this order (highest wins):
1. **CLAUDE.md / memory** — project-level and user-level instructions always override.
2. **Package-specific skill** — rules scoped to the target package.
3. **Child skills loaded below** — architecture, style-guide, documentation.

## Required Reading — Mandatory

**Always load and fully read the child skills below — first, before you do anything else, no exceptions.** Each is an index, not the rules themselves — it links out to specific reference docs (for example, `style-guide` links `patterns/functions.md`, `patterns/classes.md`, and more). You must descend into every linked doc and read it in full. The leaf docs are the source of truth; the index only points to them. **Loading a skill and inferring its rules from the doc titles — without opening the docs — is a failure, not a shortcut.**

- Load `/fdrop:code:architecture` — shared architecture rules plus package-specific rules loaded conditionally based on which package(s) you are working in.
- Load `/fdrop:code:style-guide` — function/class patterns, import/export rules, named-constant rules, and TypeScript rules.
- Load `/fdrop:code:documentation` — TSDoc/JSDoc standards for TypeScript.

You have not loaded the standards until every doc linked by these three skills is in your context. Do not begin writing or reviewing code until that is true. If a child skill or any linked doc fails to load or returns empty, stop and report — never proceed on partial standards.

## Enforcement

The consuming repo may enforce some of these rules via its lint config. If the repo's lint config and a doc disagree on a mechanical rule, the lint config wins — report the drift.

## Workflow

After loading the child skills above, apply their rules to every code change you make:

1. **Read** every doc referenced by each child skill, in full — they list specific markdown files, and each one is required reading.
2. **Write code** that satisfies all loaded rules simultaneously. Every rule in those docs is binding — apply the full set, not the subset you happen to remember.
3. **Verify** each change against the docs before considering it complete — the docs are the checklist. New files go in the correct folder, functions use the correct patterns, imports follow the alias rules, and doc comments follow TSDoc style.
