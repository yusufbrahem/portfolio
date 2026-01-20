# Multi-User Portfolio System - Architecture Design

## Overview

Transitioning from a single-admin portfolio to a **product-ready, multi-user system** where each user owns their own portfolio with complete data isolation.

---

## 1. Database Schema

### Core Authentication

#### User
```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String    // bcrypt hashed password
  name         String?   // Optional display name
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  portfolio    Portfolio? // One-to-one relationship
}
```

**Key Points:**
- Email is unique identifier
- Password stored as bcrypt hash (never plain text)
- One user = one portfolio (1:1 relationship)

---

#### Portfolio
```prisma
model Portfolio {
  id        String   @id @default(uuid())
  userId    String   @unique // Foreign key to User
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relationships
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Content relationships (1:Many)
  skillGroups     SkillGroup[]
  projects        Project[]
  experiences     Experience[]
  
  // Content relationships (1:1)
  aboutContent    AboutContent?
  architectureContent ArchitectureContent?
  personInfo      PersonInfo?
  heroContent     HeroContent?
}
```

**Key Points:**
- Each portfolio belongs to exactly one user
- Cascade delete: deleting user deletes portfolio and all content
- Central ownership point for all content

---

### Content Models (Portfolio-Owned)

#### Skills
```prisma
model SkillGroup {
  id          String   @id @default(uuid())
  portfolioId String   // Foreign key to Portfolio
  name        String
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  portfolio   Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  skills      Skill[]
  
  @@index([portfolioId, order])
}

model Skill {
  id           String     @id @default(uuid())
  skillGroupId String
  name         String
  order         Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  skillGroup   SkillGroup @relation(fields: [skillGroupId], references: [id], onDelete: Cascade)
  
  @@index([skillGroupId, order])
}
```

#### Projects
```prisma
model Project {
  id          String         @id @default(uuid())
  portfolioId String         // Foreign key to Portfolio
  title       String
  summary     String
  order       Int            @default(0)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  
  portfolio   Portfolio      @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  bullets     ProjectBullet[]
  tags        ProjectTag[]
  
  @@index([portfolioId, order])
}

model ProjectBullet {
  id        String   @id @default(uuid())
  projectId String
  text      String
  order     Int      @default(0)
  createdAt DateTime @default(now())
  
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@index([projectId, order])
}

model ProjectTag {
  id        String   @id @default(uuid())
  projectId String
  name      String
  order     Int      @default(0)
  createdAt DateTime @default(now())
  
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@index([projectId, order])
}
```

#### Experience
```prisma
model Experience {
  id          String            @id @default(uuid())
  portfolioId String            // Foreign key to Portfolio
  title       String
  company     String
  location    String
  period      String
  order       Int               @default(0)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  
  portfolio   Portfolio         @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  bullets     ExperienceBullet[]
  tech        ExperienceTech[]
  
  @@index([portfolioId, order])
}

model ExperienceBullet {
  id           String     @id @default(uuid())
  experienceId String
  text         String
  order         Int       @default(0)
  createdAt     DateTime  @default(now())
  
  experience   Experience @relation(fields: [experienceId], references: [id], onDelete: Cascade)
  
  @@index([experienceId, order])
}

model ExperienceTech {
  id           String     @id @default(uuid())
  experienceId String
  name         String
  order         Int       @default(0)
  createdAt     DateTime  @default(now())
  
  experience   Experience @relation(fields: [experienceId], references: [id], onDelete: Cascade)
  
  @@index([experienceId, order])
}
```

#### About Content
```prisma
model AboutContent {
  id          String            @id @default(uuid())
  portfolioId String            @unique // One per portfolio
  title       String
  paragraphs  String            // JSON array stored as string
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  
  portfolio   Portfolio         @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  principles  AboutPrinciple[]
}

model AboutPrinciple {
  id             String        @id @default(uuid())
  aboutContentId String
  title          String
  description    String
  order          Int           @default(0)
  createdAt      DateTime      @default(now())
  
  aboutContent   AboutContent  @relation(fields: [aboutContentId], references: [id], onDelete: Cascade)
  
  @@index([aboutContentId, order])
}
```

#### Architecture Content
```prisma
model ArchitectureContent {
  id          String              @id @default(uuid())
  portfolioId String              @unique // One per portfolio
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
  
  portfolio   Portfolio           @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  pillars     ArchitecturePillar[]
}

model ArchitecturePillar {
  id                    String              @id @default(uuid())
  architectureContentId String
  title                 String
  order                 Int                 @default(0)
  createdAt             DateTime            @default(now())
  
  architectureContent   ArchitectureContent @relation(fields: [architectureContentId], references: [id], onDelete: Cascade)
  points                ArchitecturePoint[]
  
  @@index([architectureContentId, order])
}

model ArchitecturePoint {
  id                    String              @id @default(uuid())
  architecturePillarId String
  text                  String
  order                 Int                 @default(0)
  createdAt             DateTime            @default(now())
  
  architecturePillar   ArchitecturePillar  @relation(fields: [architecturePillarId], references: [id], onDelete: Cascade)
  
  @@index([architecturePillarId, order])
}
```

#### Person Info (Contact)
```prisma
model PersonInfo {
  id          String   @id @default(uuid())
  portfolioId String   @unique // One per portfolio
  name        String
  role        String
  location    String
  email       String
  linkedIn    String
  cvUrl       String?  // URL to CV/Resume PDF file
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  portfolio   Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
}
```

#### Hero Content
```prisma
model HeroContent {
  id          String   @id @default(uuid())
  portfolioId String   @unique // One per portfolio
  headline    String
  subheadline String
  highlights  String   // JSON array stored as string
  createdAt   DateTime @default(now())
  updatedAt  DateTime @default(now())
  
  portfolio   Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
}
```

---

## 2. Relationships Diagram

```
User (1) ──────── (1) Portfolio
                          │
                          ├─── (1:Many) SkillGroup ──── (1:Many) Skill
                          ├─── (1:Many) Project ──── (1:Many) ProjectBullet
                          │                          └─── (1:Many) ProjectTag
                          ├─── (1:Many) Experience ──── (1:Many) ExperienceBullet
                          │                          └─── (1:Many) ExperienceTech
                          ├─── (1:1) AboutContent ──── (1:Many) AboutPrinciple
                          ├─── (1:1) ArchitectureContent ──── (1:Many) ArchitecturePillar ──── (1:Many) ArchitecturePoint
                          ├─── (1:1) PersonInfo
                          └─── (1:1) HeroContent
```

**Relationship Summary:**
- **User ↔ Portfolio**: 1:1 (one user, one portfolio)
- **Portfolio → Content**: All content models have `portfolioId` foreign key
- **Cascade Delete**: Deleting a user deletes their portfolio and all associated content

---

## 3. Data Flow & Access Control

### Authentication Flow

1. **User Registration**
   - User provides email + password
   - Password hashed with bcrypt (salt rounds: 10-12)
   - User record created in database
   - Portfolio automatically created for user (1:1 relationship)

2. **User Login**
   - User provides email + password
   - System fetches user by email
   - Password verified using bcrypt.compare()
   - Session created (cookie-based, httpOnly, secure)
   - Session contains userId

3. **Authenticated Requests**
   - Middleware extracts userId from session
   - All admin routes require authenticated user
   - Server actions verify user owns the portfolio being accessed

### Data Access Flow

1. **Portfolio Ownership Verification**
   ```
   Request → Middleware (extract userId) → Server Action
   Server Action:
     - Get user's portfolioId
     - Verify requested resource belongs to portfolioId
     - Proceed if authorized, reject if not
   ```

2. **Content Queries**
   ```
   Public Pages:
     - Query by portfolioId (or userId)
     - No authentication required for viewing
   
   Admin Pages:
     - Query by userId (from session)
     - Automatically filter by user's portfolioId
     - User can only see/edit their own content
   ```

3. **Content Creation/Update**
   ```
   Create/Update Request:
     - Extract userId from session
     - Get user's portfolioId
     - Associate new/updated content with portfolioId
     - Ensure user cannot modify other users' portfolios
   ```

### Security Principles

1. **Data Isolation**
   - Every query filters by `portfolioId`
   - User can only access their own portfolio
   - No cross-user data leakage

2. **Authorization Checks**
   - Middleware: Verifies user is authenticated
   - Server Actions: Verify ownership before any write operation
   - Database: Foreign keys enforce referential integrity

3. **Password Security**
   - Passwords never stored in plain text
   - bcrypt hashing with salt
   - Password reset flow (future enhancement)

---

## 4. Migration Strategy

### Phase 1: Schema Migration
- Add User and Portfolio models
- Add `portfolioId` to all content models
- Migrate existing data to a default portfolio for admin user

### Phase 2: Authentication
- Replace env-based auth with user-based auth
- Implement registration/login endpoints
- Update middleware to use session-based auth

### Phase 3: Data Isolation
- Update all queries to filter by portfolioId
- Add ownership checks to all server actions
- Update admin UI to work with user's own portfolio

---

## 5. Key Design Decisions

### Why 1:1 User:Portfolio?
- **Simplicity**: One user = one portfolio (clear ownership)
- **Future-proof**: Can easily extend to 1:Many later if needed
- **Performance**: Simpler queries, no need to select portfolio

### Why portfolioId on all content?
- **Clear ownership**: Every piece of content belongs to a portfolio
- **Easy filtering**: Simple WHERE portfolioId = ? queries
- **Cascade delete**: Deleting portfolio removes all content automatically

### Why keep existing content structure?
- **Minimal changes**: Reuse existing models, just add portfolioId
- **Backward compatible**: Existing queries can be updated incrementally
- **Proven structure**: Current schema works well

---

## 6. Future Enhancements (Out of Scope)

- Multiple portfolios per user (1:Many)
- Portfolio sharing/collaboration
- Public/private portfolio visibility
- Portfolio templates
- Domain/subdomain routing per portfolio
- User roles (admin, editor, viewer)

---

## Summary

**Core Changes:**
1. ✅ User model with bcrypt password hashing
2. ✅ Portfolio model (1:1 with User)
3. ✅ All content models get `portfolioId` foreign key
4. ✅ Cascade delete ensures data cleanup
5. ✅ Session-based authentication replaces env passwords

**Security:**
- Passwords hashed with bcrypt
- Data isolated by portfolioId
- Ownership verified on every operation
- No cross-user data access

**Scalability:**
- Ready for multi-user from day one
- Easy to add features (sharing, templates, etc.)
- Database indexes on portfolioId for performance
