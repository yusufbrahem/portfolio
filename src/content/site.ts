export const site = {
  person: {
    name: "Youssef Brahem",
    role: "Senior Backend & Fintech Engineer",
    location: "Doha, Qatar",
    email: "yusufbrahem1@gmail.com",
    linkedIn: "https://www.linkedin.com/in/youssef-brahem-8ab717159/",
  },
  hero: {
    headline: "Senior Backend & Fintech Engineer building secure banking platforms.",
    subheadline:
      "5+ years delivering transaction systems, payment integrations, and identity-driven APIs in banking and fintech. Specialized in Java, Spring Boot, OAuth2/OpenID Connect, Keycloak, and production-grade reliability.",
    highlights: [
      "Secure REST APIs and service-to-service authorization",
      "Transaction processing, payments, reconciliation, and auditability",
      "Bank-grade observability, resilience, and operational readiness",
    ],
  },
  about: {
    title: "Backend engineering for banking-grade security and reliability",
    paragraphs: [
      "I’m a Senior Backend Engineer based in Doha, Qatar. I currently work as a Banking Consultant at Proxym Qatar supporting Qatar International Islamic Bank (QIIB), contributing to large-scale mobile and digital banking platforms.",
      "My focus is building secure, resilient services that handle money movement and identity with precision: OAuth2/OpenID Connect, Keycloak-based IAM, transaction integrity, and operational excellence.",
      "I prioritize clear domain boundaries, pragmatic architecture, and measurable risk reduction—systems designed to scale without compromising security, auditability, or latency.",
    ],
    principles: [
      {
        title: "Security by design",
        description:
          "Least privilege, strong authentication flows, secure defaults, and audit trails from day one.",
      },
      {
        title: "Transactional integrity",
        description:
          "Idempotency, reconciliation, and consistent state across services to prevent financial drift.",
      },
      {
        title: "Production readiness",
        description:
          "Observability, failure modes, runbooks, and safe rollout patterns built into delivery.",
      },
    ],
  },
  experience: {
    intro:
      "Experience across banking and fintech, with emphasis on secure APIs, transaction platforms, and identity governance.",
    roles: [
      {
        title: "Banking Consultant (Backend)",
        company: "Proxym Qatar (Client: Qatar International Islamic Bank — QIIB)",
        location: "Doha, Qatar",
        period: "Current",
        bullets: [
          "Delivered secure backend capabilities for digital banking journeys, emphasizing authorization, auditability, and operational resilience.",
          "Designed OAuth2/OIDC integrations with Keycloak to standardize identity, token lifecycles, and role-based access across channels.",
          "Worked closely with security, QA, and platform teams to harden API contracts and reduce production risk through automation and observability.",
        ],
        tech: ["Java", "Spring Boot", "Keycloak", "OAuth2/OIDC", "REST APIs"],
      },
      {
        title: "Senior Backend Engineer (Banking & Fintech)",
        company: "Fintech/BFSI environments (confidential)",
        location: "MENA region",
        period: "5+ years total (Banking & Fintech)",
        bullets: [
          "Built and maintained high-stakes backend services supporting payments, transaction processing, and partner integrations.",
          "Implemented access control and audit logging patterns aligned with bank governance and compliance expectations.",
          "Improved service reliability through better error handling, idempotent APIs, and actionable monitoring.",
        ],
        tech: ["Java", "Spring Boot", "SQL", "Distributed Systems", "Observability"],
      },
    ],
  },
  skills: [
    {
      group: "Backend & Platforms",
      items: [
        "Java",
        "Spring Boot",
        "REST API design",
        "Microservices",
        "Event-driven patterns",
        "Caching and performance tuning",
      ],
    },
    {
      group: "Security & Identity",
      items: [
        "OAuth2",
        "OpenID Connect",
        "Keycloak",
        "JWT",
        "RBAC/ABAC concepts",
        "API security hardening",
        "Audit logging",
      ],
    },
    {
      group: "Data & Persistence",
      items: [
        "Relational databases (SQL)",
        "Transactions and consistency",
        "Schema design",
        "Indexing and query optimization",
        "Data integrity controls",
      ],
    },
    {
      group: "Architecture & Operations",
      items: [
        "System design for resilience",
        "Observability (logs/metrics/tracing)",
        "CI/CD",
        "Release safety patterns",
        "Incident-driven improvements",
      ],
    },
  ],
  projects: [
    {
      title: "Digital Banking API Security Layer",
      summary:
        "A secure API surface for mobile and web channels with standardized OAuth2/OIDC flows and bank-grade authorization.",
      bullets: [
        "Defined token and session strategy (access/refresh), scopes, and role mapping aligned with banking governance.",
        "Implemented reusable security middleware patterns: validation, authorization decisions, and audit events.",
        "Designed error contracts and security telemetry to support faster incident triage and compliance reporting.",
      ],
      tags: ["Spring Boot", "Keycloak", "OAuth2/OIDC", "REST", "Security"],
    },
    {
      title: "Transaction Processing & Reconciliation Patterns",
      summary:
        "Core patterns for safe money movement: idempotency, state transitions, and reconciliation to prevent financial drift.",
      bullets: [
        "Applied idempotency keys and deterministic processing for retries and at-least-once delivery scenarios.",
        "Designed consistent state transitions with audit trails suitable for financial investigations.",
        "Built reconciliation workflows to detect mismatches and support controlled remediation.",
      ],
      tags: ["Transactions", "Consistency", "Auditability", "Distributed Systems"],
    },
    {
      title: "Operational Readiness Upgrade",
      summary:
        "Improved production reliability through better observability, safer deployments, and clearer failure modes.",
      bullets: [
        "Introduced actionable dashboards and alerting signals tied to customer impact and system SLOs.",
        "Hardened API resilience with timeouts, retries, circuit-breaking guidance, and error taxonomy.",
        "Documented runbooks and operational workflows to reduce mean time to recovery.",
      ],
      tags: ["Reliability", "Observability", "Resilience", "SLOs"],
    },
  ],
  architecture: {
    pillars: [
      {
        title: "Identity & Access Management",
        points: [
          "OAuth2/OpenID Connect flows for mobile, web, and partner integrations",
          "Keycloak-based realm design, clients/scopes, token lifecycles, and role mapping",
          "Least privilege and consistent authorization decisions across services",
        ],
      },
      {
        title: "Transaction safety",
        points: [
          "Idempotent APIs and predictable retries",
          "State machines for transaction lifecycles and consistent audit trails",
          "Reconciliation strategy for detection and controlled remediation of mismatches",
        ],
      },
      {
        title: "Scalability & reliability",
        points: [
          "Clear domain boundaries with pragmatic microservices where justified",
          "Backpressure, timeouts, and failure isolation",
          "Metrics, tracing, and logs designed for incident response",
        ],
      },
    ],
  },
} as const;

