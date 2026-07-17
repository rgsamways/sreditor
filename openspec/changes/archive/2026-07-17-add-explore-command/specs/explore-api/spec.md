## ADDED Requirements

### Requirement: Read endpoint serves current top-N cards per tag
The system SHALL expose a `GET /v1/explore` endpoint returning the current top-N cards (by `buzzyUnsolvedScore`, within a recency window) overall or filtered by tag via a query parameter, without requiring any developer identity or authentication.

#### Scenario: Fetching current cards
- **WHEN** the CLI issues `GET /v1/explore`
- **THEN** the response contains a bounded list of current cards, each with `id`, `tag`, `title`, `summary`, `sourceUrl`, `sourceType`, and `clusteredAt`

#### Scenario: Filtering by tag
- **WHEN** the CLI issues `GET /v1/explore?tag=<tag>`
- **THEN** only cards matching that tag are returned

### Requirement: Cards are produced by a periodic refresh job, not authored per-request
The system SHALL populate its card corpus via a separate refresh process that pulls raw items from external sources (arXiv, papers-with-code, GitHub trending, HN, framework changelogs) and clusters them into cards via an LLM pass, run on a schedule independent of any read request, and the read endpoint SHALL NOT perform LLM calls on the request path.

#### Scenario: Refresh job runs
- **WHEN** the refresh job executes
- **THEN** new or updated cards are upserted into the corpus with a fresh `clusteredAt` timestamp, and no LLM call occurs as part of serving a subsequent `GET /v1/explore` request

### Requirement: No developer-identifying or project-identifying data is accepted or stored
The system SHALL NOT accept, log, or store any project name, developer identity, or judgment-log content as part of serving `GET /v1/explore` — the corpus and its cards are the same for every requester.

#### Scenario: Serving a request
- **WHEN** any client issues `GET /v1/explore`
- **THEN** the response depends only on the current corpus state, not on any information about who is asking
