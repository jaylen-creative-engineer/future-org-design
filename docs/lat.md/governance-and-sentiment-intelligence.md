# Governance and sentiment intelligence

Governance and sentiment intelligence for ODaaS: provide a portal for employee support requests and policy Q&A while consolidating NPS/eNPS context for actionable organizational sentiment.

## Executive snapshot

Organizations need a governed path from question to answer to measurable impact. Policy guidance on AI usage, speakers, and related conduct often lives in fragmented channels, and sentiment signals are tracked separately from redesign decisions. This creates execution drag and weak feedback loops — [[buyers-and-pain#Confidence–execution gap]], [[buyers-and-pain#Continuous design gap]].

ODaaS can treat governance and sentiment as a monitored intelligence domain connected to decision rights and redesign outcomes — [[strategic-gaps#Operating model layer]], [[closed-loop-value-chain#Closed-loop pipeline]].

## Governance workflow

Canonical flow:

1. **Intake** — employees submit support requests and governance questions.
2. **Routing** — requests follow defined ownership and approval paths.
3. **Resolution** — publish clear answer, policy stance, and rationale.
4. **Communication** — distribute updates to impacted teams and managers.
5. **Feedback** — evaluate whether guidance improved clarity and trust.

This workflow operationalizes governance as a product capability rather than static documentation.

## Sentiment intelligence model

Sentiment intelligence combines governance activity with workforce confidence signals:

- Consolidated NPS/eNPS trend lines by cohort and change window.
- Topic-level sentiment (for example policy clarity and AI trust).
- Correlation with support volume, resolution time, and re-open rates.
- Monitoring tie-in to scenario/recommendation implementation outcomes.

The goal is to make sentiment interpretable in context, not a detached scorecard — [[ai-and-data-layer#Intelligence stack]], [[closed-loop-value-chain#Why it matters]].

## MVP slices

- **GOV-01 Portal shell** — centralized intake with status tracking.
- **GOV-02 Policy Q&A** — searchable answers plus escalation path for ambiguous cases.
- **GOV-03 Governance routing** — owner assignment and approval workflow metadata.
- **GOV-04 Sentiment consolidation** — NPS/eNPS ingestion with governance context overlays.
- **GOV-05 Executive readout** — single view for request trends, resolution quality, and sentiment drift.

## Risks and constraints

- Privacy and ethics requirements for sentiment data handling.
- Governance theater risk if ownership is unclear or non-actionable.
- AI policy answer drift without source-of-truth controls and review.
- Tool sprawl risk if the portal does not integrate with redesign workflows.

Design intent: integrate governance and sentiment into continuous redesign monitoring rather than episodic surveys and isolated ticket systems.
