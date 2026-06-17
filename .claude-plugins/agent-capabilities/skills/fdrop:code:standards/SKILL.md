---
name: fdrop:code:standards
description: Shared conventions for building new features. Use when implementing a feature that spans multiple packages or has no package-specific skill.
---

# Code Standards

Follow the rules in the linked docs — they're requirements, not suggestions. Consistency is what keeps the codebase predictable to edit, for agents and humans alike.

## When to Use

Use this skill as the entry point when:
- Implementing a feature that spans multiple packages.
- Working in a package that has no dedicated package-specific skill.
- Unsure which standards apply — this skill loads the correct child skills for you.

## Precedence

When rules conflict, apply them in this order (highest wins):
1. **CLAUDE.md / memory** — project-level and user-level instructions always override.
2. **Package-specific skill** — rules scoped to the target package.
3. **Child skills loaded below** — architecture, style-guide, documentation.

## Required Skills

Before writing any code, load these skills:

- Load `/fdrop:code:architecture` — shared architecture rules plus package-specific rules loaded conditionally based on which package(s) you are working in.
- Load `/fdrop:code:style-guide` — function/class patterns, import/export rules, enum rules, and TypeScript rules.
- Load `/fdrop:code:documentation` — TSDoc/JSDoc standards for TypeScript.

## Enforcement

The consuming repo may enforce some of these rules via its lint config. If the repo's lint config and a doc disagree on a mechanical rule, the lint config wins — report the drift.

## Workflow

After loading the child skills above, apply their rules to every code change you make:

1. **Read** the docs referenced by each child skill (they list specific markdown files).
2. **Write code** that satisfies all loaded rules simultaneously.
3. **Verify** each change against the relevant docs before considering it complete — new files go in the correct folder, functions use the correct patterns, imports follow the alias rules, and doc comments follow TSDoc style.
