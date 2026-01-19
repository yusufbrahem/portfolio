# Data Model Design

## Overview
This document defines the database schema for the configurable portfolio CMS.

## Choice: SQLite + Prisma
**Rationale:** 
- SQLite is lightweight, file-based (easy to backup/deploy)
- Prisma provides type-safe queries and migrations
- Better than JSON for CRUD operations, ordering, and relationships
- No external dependencies or services required

## Schema Design

### 1. SkillGroup
Represents a category/group of skills (e.g., "Backend & Platforms")

```typescript
{
  id: string (UUID)
  name: string (e.g., "Backend & Platforms")
  order: number (for sorting)
  createdAt: DateTime
  updatedAt: DateTime
  skills: Skill[] (one-to-many)
}
```

### 2. Skill
Individual skill items within a group

```typescript
{
  id: string (UUID)
  skillGroupId: string (FK to SkillGroup)
  name: string (e.g., "Java")
  order: number (for sorting within group)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 3. Experience
Work experience entries

```typescript
{
  id: string (UUID)
  title: string (e.g., "Banking Consultant")
  company: string
  location: string
  period: string (e.g., "Current" or "2020-2023")
  order: number (for sorting)
  createdAt: DateTime
  updatedAt: DateTime
  bullets: ExperienceBullet[] (one-to-many)
  tech: ExperienceTech[] (one-to-many)
}
```

### 4. ExperienceBullet
Bullet points for an experience entry

```typescript
{
  id: string (UUID)
  experienceId: string (FK to Experience)
  text: string
  order: number
  createdAt: DateTime
}
```

### 5. ExperienceTech
Technology tags for an experience entry

```typescript
{
  id: string (UUID)
  experienceId: string (FK to Experience)
  name: string (e.g., "Java")
  order: number
  createdAt: DateTime
}
```

### 6. Project
Portfolio projects

```typescript
{
  id: string (UUID)
  title: string
  summary: string (description)
  order: number (for sorting)
  createdAt: DateTime
  updatedAt: DateTime
  bullets: ProjectBullet[] (one-to-many)
  tags: ProjectTag[] (one-to-many)
}
```

### 7. ProjectBullet
Bullet points for a project

```typescript
{
  id: string (UUID)
  projectId: string (FK to Project)
  text: string
  order: number
  createdAt: DateTime
}
```

### 8. ProjectTag
Tags for a project

```typescript
{
  id: string (UUID)
  projectId: string (FK to Project)
  name: string (e.g., "Spring Boot")
  order: number
  createdAt: DateTime
}
```

### 9. AboutContent
About page content (single record)

```typescript
{
  id: string (UUID)
  title: string
  paragraphs: string[] (JSON array)
  principles: AboutPrinciple[] (one-to-many)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 10. AboutPrinciple
Principles shown on about page

```typescript
{
  id: string (UUID)
  aboutContentId: string (FK to AboutContent)
  title: string
  description: string
  order: number
  createdAt: DateTime
}
```

### 11. PersonInfo
Contact/personal information (single record)

```typescript
{
  id: string (UUID)
  name: string
  role: string
  location: string
  email: string
  linkedIn: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 12. HeroContent
Hero section content (single record)

```typescript
{
  id: string (UUID)
  headline: string
  subheadline: string
  highlights: string[] (JSON array)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 13. ArchitectureContent
Architecture page content (single record)

```typescript
{
  id: string (UUID)
  pillars: ArchitecturePillar[] (one-to-many)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### 14. ArchitecturePillar
Architecture pillars

```typescript
{
  id: string (UUID)
  architectureContentId: string (FK to ArchitectureContent)
  title: string
  points: ArchitecturePoint[] (one-to-many)
  order: number
  createdAt: DateTime
}
```

### 15. ArchitecturePoint
Points within an architecture pillar

```typescript
{
  id: string (UUID)
  architecturePillarId: string (FK to ArchitecturePillar)
  text: string
  order: number
  createdAt: DateTime
}
```

## Notes
- All `order` fields default to 0, can be updated for custom sorting
- Single-record tables (PersonInfo, HeroContent, AboutContent, ArchitectureContent) will have only one row
- JSON arrays used for simple lists (highlights, paragraphs) to keep schema simpler
- All timestamps tracked for audit purposes
