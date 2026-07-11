# Example Change Proposal

## Technical Uncertainty
We were unsure whether the existing sync architecture could maintain consistency under intermittent connectivity without a full rewrite.

## Approach
Investigated a conflict-free replicated data type (CRDT) approach versus a last-write-wins approach, prototyped both against a simulated offline scenario.
