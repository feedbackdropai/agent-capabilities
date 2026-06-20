---
name: fdrop:tool:grill-me
description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
---

If no plan or design is present in context, ask the user to provide or point to the plan before beginning.

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time.

If a question can be answered by exploring the codebase, explore the codebase instead.

Stop when every branch of the decision tree has a resolved answer and no open dependencies remain.

When finished, produce a concise list of each decision and its resolved answer.
