# Environmental intelligence

Energy and environmental awareness for ODaaS: quantify project energy cost, estimate carbon impact, and keep sustainability trade-offs visible during org design decisions.

## Executive snapshot

AI-enabled org design should improve outcomes without hidden energy externalities.

Environmental intelligence gives operators decision-grade energy/carbon context inside the same loop as org design and workforce planning — [[closed-loop-value-chain#Closed-loop pipeline]], [[ai-and-data-layer#Intelligence stack]].

## Intelligence capability map

Core capability layers:

1. **Metering and attribution** — estimate energy usage per workspace, scenario run, and recommendation cycle.
2. **Baseline and drift detection** — track footprint deltas against prior redesign cycles.
3. **Trade-off decisions** — compare energy/carbon signals with speed, confidence, and implementation impact.
4. **Policy-aware defaults** — enforce governance constraints such as model tier, region preference, and batching.
5. **Monitoring feedback** — evaluate whether environmental posture improves after operating-model changes.

This extends prescriptive org decisions beyond chart quality into sustainable execution — [[strategic-gaps#Prescriptive analytics gap]], [[strategic-gaps#Operating model layer]].

## Data inputs

Minimum signals to start:

- AI workload metadata (model class, runtime, throughput, concurrency).
- Infrastructure metadata (region and available provider sustainability factors).
- Cost and usage exports mapped to scenario/recommendation events.
- Organizational policy thresholds and sustainability guardrails.

Signal quality can begin as bounded estimates and improve over time; delaying until perfect telemetry would preserve the same episodic blind spots already seen in redesign programs — [[buyers-and-pain#Continuous design gap]].

## Closed-loop workflow

Environmental intelligence should follow the canonical ODaaS loop:

1. **Analytics** — establish baseline energy/carbon intensity by baseline and scenario family.
2. **Design** — annotate scenario options with estimated environmental deltas.
3. **Planning** — include footprint implications in workforce and implementation sequencing.
4. **Implementation** — apply policy defaults to keep execution within target bounds.
5. **Monitoring** — trend post-change environmental signals alongside organizational outcomes.

This keeps environmental posture inside accountable delivery rather than separate ESG reporting — [[closed-loop-value-chain#Why it matters]], [[odaas-core#ODaaS product thesis]].

## MVP slices

These slices stage delivery from transparency to policy-aware action.

- **ENV-01 Transparency** — show per-run estimate and rolling monthly aggregate.
- **ENV-02 Baseline drift** — flag meaningful increases vs baseline by workspace.
- **ENV-03 Policy controls** — support rules for preferred model/region and heavy-job batching.
- **ENV-04 Loop integration** — pair environmental metrics with scenario/recommendation outcomes in monitoring views.

## Risks and constraints

- Estimates can be directionally useful before they are audit-grade.
- Over-optimization for energy alone can degrade organizational outcomes.
- Provider disclosure granularity differs across regions and service tiers.

Design intent: keep environment as a first-class decision input, not a siloed dashboard.
