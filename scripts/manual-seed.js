// Manual seeding script using raw SQLite
// Bypasses Prisma adapter issues

const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// Import site data (inline for now - can be improved)
const site = {
  person: {
    name: "Youssef Brahem",
    role: "Senior Backend & Fintech Engineer",
    location: "Doha, Qatar",
    email: "yusufbrahem1@gmail.com",
    linkedIn: "https://www.linkedin.com/in/youssef-brahem-8ab717159/",
  },
  hero: {
    headline: "Senior Backend & Fintech Engineer building secure banking platforms.",
    subheadline: "5+ years delivering transaction systems, payment integrations, and identity-driven APIs in banking and fintech. Specialized in Java, Spring Boot, OAuth2/OpenID Connect, Keycloak, and production-grade reliability.",
    highlights: [
      "Secure REST APIs and service-to-service authorization",
      "Transaction processing, payments, reconciliation, and auditability",
      "Bank-grade observability, resilience, and operational readiness",
    ],
  },
  skills: [
    { group: "Backend & Platforms", items: ["Java", "Spring Boot", "REST API design", "Microservices", "Event-driven patterns", "Caching and performance tuning"] },
    { group: "Security & Identity", items: ["OAuth2", "OpenID Connect", "Keycloak", "JWT", "RBAC/ABAC concepts", "API security hardening", "Audit logging"] },
    { group: "Data & Persistence", items: ["Relational databases (SQL)", "Transactions and consistency", "Schema design", "Indexing and query optimization", "Data integrity controls"] },
    { group: "Architecture & Operations", items: ["System design for resilience", "Observability (logs/metrics/tracing)", "CI/CD", "Release safety patterns", "Incident-driven improvements"] },
  ],
  experience: {
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
  projects: [
    {
      title: "Digital Banking API Security Layer",
      summary: "A secure API surface for mobile and web channels with standardized OAuth2/OIDC flows and bank-grade authorization.",
      bullets: [
        "Defined token and session strategy (access/refresh), scopes, and role mapping aligned with banking governance.",
        "Implemented reusable security middleware patterns: validation, authorization decisions, and audit events.",
        "Designed error contracts and security telemetry to support faster incident triage and compliance reporting.",
      ],
      tags: ["Spring Boot", "Keycloak", "OAuth2/OIDC", "REST", "Security"],
    },
    {
      title: "Transaction Processing & Reconciliation Patterns",
      summary: "Core patterns for safe money movement: idempotency, state transitions, and reconciliation to prevent financial drift.",
      bullets: [
        "Applied idempotency keys and deterministic processing for retries and at-least-once delivery scenarios.",
        "Designed consistent state transitions with audit trails suitable for financial investigations.",
        "Built reconciliation workflows to detect mismatches and support controlled remediation.",
      ],
      tags: ["Transactions", "Consistency", "Auditability", "Distributed Systems"],
    },
    {
      title: "Operational Readiness Upgrade",
      summary: "Improved production reliability through better observability, safer deployments, and clearer failure modes.",
      bullets: [
        "Introduced actionable dashboards and alerting signals tied to customer impact and system SLOs.",
        "Hardened API resilience with timeouts, retries, circuit-breaking guidance, and error taxonomy.",
        "Documented runbooks and operational workflows to reduce mean time to recovery.",
      ],
      tags: ["Reliability", "Observability", "Resilience", "SLOs"],
    },
  ],
  about: {
    title: "Backend engineering for banking-grade security and reliability",
    paragraphs: [
      "I'm a Senior Backend Engineer based in Doha, Qatar. I currently work as a Banking Consultant at Proxym Qatar supporting Qatar International Islamic Bank (QIIB), contributing to large-scale mobile and digital banking platforms.",
      "My focus is building secure, resilient services that handle money movement and identity with precision: OAuth2/OpenID Connect, Keycloak-based IAM, transaction integrity, and operational excellence.",
      "I prioritize clear domain boundaries, pragmatic architecture, and measurable risk reduction—systems designed to scale without compromising security, auditability, or latency.",
    ],
    principles: [
      { title: "Security by design", description: "Least privilege, strong authentication flows, secure defaults, and audit trails from day one." },
      { title: "Transactional integrity", description: "Idempotency, reconciliation, and consistent state across services to prevent financial drift." },
      { title: "Production readiness", description: "Observability, failure modes, runbooks, and safe rollout patterns built into delivery." },
    ],
  },
};

const dbPath = path.resolve(process.cwd(), "dev.db");

// Ensure database exists
if (!fs.existsSync(dbPath)) {
  console.log("Database file not found. Please run migrations first:");
  console.log("npm run db:migrate");
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);

function runSQL(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getSQL(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function seed() {
  console.log("Starting manual seed...");

  try {
    // Seed PersonInfo
    await runSQL(
      `INSERT OR REPLACE INTO PersonInfo (id, name, role, location, email, linkedIn, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ["person-1", site.person.name, site.person.role, site.person.location, site.person.email, site.person.linkedIn]
    );
    console.log("✓ PersonInfo seeded");

    // Seed HeroContent
    await runSQL(
      `INSERT OR REPLACE INTO HeroContent (id, headline, subheadline, highlights, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ["hero-1", site.hero.headline, site.hero.subheadline, JSON.stringify(site.hero.highlights)]
    );
    console.log("✓ HeroContent seeded");

    // Seed Skills
    for (let i = 0; i < site.skills.length; i++) {
      const group = site.skills[i];
      await runSQL(
        `INSERT OR REPLACE INTO SkillGroup (id, name, "order", createdAt, updatedAt)
         VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
        [`group-${i}`, group.group, i]
      );

      // Delete existing skills for this group
      await runSQL(`DELETE FROM Skill WHERE skillGroupId = ?`, [`group-${i}`]);

      // Insert skills
      for (let j = 0; j < group.items.length; j++) {
        await runSQL(
          `INSERT INTO Skill (id, skillGroupId, name, "order", createdAt, updatedAt)
           VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
          [`skill-${i}-${j}`, `group-${i}`, group.items[j], j]
        );
      }
    }
    console.log("✓ Skills seeded");

    // Seed Experience
    for (let i = 0; i < site.experience.roles.length; i++) {
      const role = site.experience.roles[i];
      await runSQL(
        `INSERT OR REPLACE INTO Experience (id, title, company, location, period, "order", createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [`exp-${i}`, role.title, role.company, role.location, role.period, i]
      );

      // Delete existing bullets and tech
      await runSQL(`DELETE FROM ExperienceBullet WHERE experienceId = ?`, [`exp-${i}`]);
      await runSQL(`DELETE FROM ExperienceTech WHERE experienceId = ?`, [`exp-${i}`]);

      // Insert bullets
      for (let j = 0; j < role.bullets.length; j++) {
        await runSQL(
          `INSERT INTO ExperienceBullet (id, experienceId, text, "order", createdAt)
           VALUES (?, ?, ?, ?, datetime('now'))`,
          [`bullet-${i}-${j}`, `exp-${i}`, role.bullets[j], j]
        );
      }

      // Insert tech
      for (let j = 0; j < role.tech.length; j++) {
        await runSQL(
          `INSERT INTO ExperienceTech (id, experienceId, name, "order", createdAt)
           VALUES (?, ?, ?, ?, datetime('now'))`,
          [`tech-${i}-${j}`, `exp-${i}`, role.tech[j], j]
        );
      }
    }
    console.log("✓ Experience seeded");

    // Seed Projects
    for (let i = 0; i < site.projects.length; i++) {
      const project = site.projects[i];
      await runSQL(
        `INSERT OR REPLACE INTO Project (id, title, summary, "order", createdAt, updatedAt)
         VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [`proj-${i}`, project.title, project.summary, i]
      );

      // Delete existing bullets and tags
      await runSQL(`DELETE FROM ProjectBullet WHERE projectId = ?`, [`proj-${i}`]);
      await runSQL(`DELETE FROM ProjectTag WHERE projectId = ?`, [`proj-${i}`]);

      // Insert bullets
      for (let j = 0; j < project.bullets.length; j++) {
        await runSQL(
          `INSERT INTO ProjectBullet (id, projectId, text, "order", createdAt)
           VALUES (?, ?, ?, ?, datetime('now'))`,
          [`pbullet-${i}-${j}`, `proj-${i}`, project.bullets[j], j]
        );
      }

      // Insert tags
      for (let j = 0; j < project.tags.length; j++) {
        await runSQL(
          `INSERT INTO ProjectTag (id, projectId, name, "order", createdAt)
           VALUES (?, ?, ?, ?, datetime('now'))`,
          [`ptag-${i}-${j}`, `proj-${i}`, project.tags[j], j]
        );
      }
    }
    console.log("✓ Projects seeded");

    // Seed AboutContent
    await runSQL(
      `INSERT OR REPLACE INTO AboutContent (id, title, paragraphs, createdAt, updatedAt)
       VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
      ["about-1", site.about.title, JSON.stringify(site.about.paragraphs)]
    );

    // Delete existing principles
    await runSQL(`DELETE FROM AboutPrinciple WHERE aboutContentId = ?`, ["about-1"]);

    // Insert principles
    for (let i = 0; i < site.about.principles.length; i++) {
      const principle = site.about.principles[i];
      await runSQL(
        `INSERT INTO AboutPrinciple (id, aboutContentId, title, description, "order", createdAt)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [`principle-${i}`, "about-1", principle.title, principle.description, i]
      );
    }
    console.log("✓ AboutContent seeded");

    console.log("\n✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    db.close();
  }
}

seed();
