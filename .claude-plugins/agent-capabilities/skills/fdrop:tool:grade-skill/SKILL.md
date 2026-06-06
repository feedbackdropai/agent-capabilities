---
name: fdrop:tool:grade-skill
description: Grades a skill's quality and offers targeted improvement suggestions. Use when reviewing or improving an existing skill.
allowed-tools: read, bash, skill
---

# Grade Skill

## Input

```
/grade-skill <skill-name>
```

## Instructions

Please grade the provided skill.

### Grading rules

- An A grade is a real grade. Do not manufacture feedback to justify your existence.
- Only include suggestions that will actually help this skill move to A grade and reduce feedback from future review agents.
- **Wrapper agents** exist solely to make a skill spawnable via the Agent tool. Do not penalize thin wrapping — that IS the design.

### Output format

```
Grade: <A | B+ | B | C | D>
Skill: <skill-name>

[If not A:]
| # | Gap | Suggested Fix |
|---|-----|---------------|
| 1 | ... | ... |
```
