import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create PostgreSQL adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

/**
 * Generate a simple hash from string for consistent but varied data generation
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Add length and first/last chars for better distribution
  hash = hash + str.length * 1000 + (str.charCodeAt(0) || 0) * 100 + (str.charCodeAt(str.length - 1) || 0);
  return Math.abs(hash);
}

/**
 * Generate unique portfolio data for a user based on their email/name
 */
async function seedPortfolioData(portfolioId: string, userEmail: string, userName: string | null, userIndex: number) {
  const displayName = userName || userEmail.split("@")[0];
  const emailPrefix = userEmail.split("@")[0];
  const hash = simpleHash(userEmail);
  
  // Use combination of hash and index to ensure different profiles
  const profileIndex = (hash + userIndex) % 5; // 5 different profile types

  console.log(`  Creating unique portfolio data for ${displayName} (${userEmail})...`);

  // Define different profile types
  const profiles = [
    {
      role: "Full Stack Developer",
      location: "San Francisco, CA",
      headline: `${displayName} — Full Stack Developer`,
      subheadline: `Passionate full stack developer with expertise in modern web technologies. Building scalable applications with React, Node.js, and cloud infrastructure.`,
      highlights: [
        "React, TypeScript, and modern frontend frameworks",
        "Node.js, Express, and RESTful API design",
        "Cloud deployment and DevOps practices",
      ],
      skills: [
        {
          group: "Frontend",
          items: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Redux", "GraphQL"],
        },
        {
          group: "Backend",
          items: ["Node.js", "Express", "PostgreSQL", "MongoDB", "REST APIs", "Microservices"],
        },
        {
          group: "DevOps & Tools",
          items: ["Docker", "AWS", "Git", "CI/CD", "Jest", "Webpack"],
        },
      ],
      experience: [
        {
          title: "Senior Full Stack Developer",
          company: "Tech Innovations Inc.",
          location: "San Francisco, CA",
          period: "2022 - Present",
          bullets: [
            "Led development of customer-facing web applications serving 100K+ users",
            "Architected microservices infrastructure reducing latency by 40%",
            "Mentored junior developers and established coding standards",
          ],
          tech: ["React", "Node.js", "PostgreSQL", "AWS", "Docker"],
        },
        {
          title: "Full Stack Developer",
          company: "StartupHub",
          location: "Remote",
          period: "2020 - 2022",
          bullets: [
            "Built MVP features for early-stage SaaS product",
            "Implemented real-time collaboration features using WebSockets",
            "Optimized database queries improving page load times by 60%",
          ],
          tech: ["Vue.js", "Express", "MongoDB", "Redis", "Socket.io"],
        },
      ],
      projects: [
        {
          title: "E-Commerce Platform",
          summary: "Scalable e-commerce solution with payment integration and inventory management",
          bullets: [
            "Built with React and Node.js, handling 10K+ daily transactions",
            "Integrated Stripe payment gateway with webhook handling",
            "Implemented real-time inventory tracking and notifications",
          ],
          tags: ["React", "Node.js", "Stripe", "PostgreSQL", "Redis"],
        },
        {
          title: "Task Management Dashboard",
          summary: "Collaborative project management tool with real-time updates",
          bullets: [
            "Real-time synchronization using WebSockets",
            "Drag-and-drop interface with optimistic UI updates",
            "Role-based access control and team collaboration features",
          ],
          tags: ["React", "Socket.io", "Express", "MongoDB"],
        },
      ],
      about: {
        title: "Building modern web applications with clean code and user focus",
        paragraphs: [
          `I'm ${displayName}, a full stack developer passionate about creating intuitive digital experiences. I specialize in building scalable web applications using modern JavaScript frameworks and cloud technologies.`,
          "My approach combines clean architecture, performance optimization, and user-centered design. I enjoy solving complex problems and turning ideas into production-ready applications.",
          "When not coding, I contribute to open source projects and stay updated with the latest web technologies and best practices.",
        ],
        principles: [
          {
            title: "Code quality",
            description: "Writing maintainable, testable code with clear documentation and best practices.",
          },
          {
            title: "User experience",
            description: "Prioritizing intuitive interfaces and smooth interactions that delight users.",
          },
          {
            title: "Continuous learning",
            description: "Staying current with technology trends and continuously improving skills.",
          },
        ],
      },
      architecture: {
        pillars: [
          {
            title: "Component architecture",
            points: [
              "Reusable, composable React components",
              "State management with Redux and Context API",
              "Type-safe development with TypeScript",
            ],
          },
          {
            title: "API design",
            points: [
              "RESTful endpoints with clear contracts",
              "Error handling and validation middleware",
              "Rate limiting and security best practices",
            ],
          },
          {
            title: "Scalability",
            points: [
              "Microservices architecture for independent scaling",
              "Caching strategies with Redis",
              "Database optimization and indexing",
            ],
          },
        ],
      },
    },
    {
      role: "Data Engineer",
      location: "New York, NY",
      headline: `${displayName} — Data Engineer`,
      subheadline: `Data engineer specializing in building robust data pipelines, ETL processes, and analytics infrastructure. Transforming raw data into actionable insights.`,
      highlights: [
        "Big data processing with Spark and Hadoop",
        "Data pipeline orchestration and monitoring",
        "Cloud data warehouses and analytics platforms",
      ],
      skills: [
        {
          group: "Data Processing",
          items: ["Apache Spark", "Python", "Pandas", "SQL", "ETL", "Data Modeling"],
        },
        {
          group: "Cloud & Infrastructure",
          items: ["AWS", "GCP", "Snowflake", "Airflow", "Docker", "Kubernetes"],
        },
        {
          group: "Analytics & Visualization",
          items: ["Tableau", "Looker", "dbt", "Jupyter", "Python", "R"],
        },
      ],
      experience: [
        {
          title: "Senior Data Engineer",
          company: "DataCorp Analytics",
          location: "New York, NY",
          period: "2021 - Present",
          bullets: [
            "Designed and implemented data pipelines processing 1TB+ daily",
            "Reduced ETL job runtime by 50% through optimization and parallelization",
            "Built real-time analytics dashboards for business stakeholders",
          ],
          tech: ["Spark", "Python", "Airflow", "Snowflake", "AWS"],
        },
        {
          title: "Data Engineer",
          company: "Analytics Solutions",
          location: "Boston, MA",
          period: "2019 - 2021",
          bullets: [
            "Developed ETL pipelines for customer data integration",
            "Created data quality monitoring and alerting systems",
            "Collaborated with data scientists on ML model deployment",
          ],
          tech: ["Python", "PostgreSQL", "Airflow", "Tableau"],
        },
      ],
      projects: [
        {
          title: "Real-Time Analytics Pipeline",
          summary: "Streaming data pipeline for real-time business metrics and reporting",
          bullets: [
            "Processed 10M+ events per day using Apache Kafka and Spark Streaming",
            "Built automated data quality checks and anomaly detection",
            "Reduced reporting latency from hours to minutes",
          ],
          tags: ["Kafka", "Spark", "Python", "Airflow", "Snowflake"],
        },
        {
          title: "Data Warehouse Migration",
          summary: "Migrated legacy data warehouse to cloud-native architecture",
          bullets: [
            "Designed new schema optimized for analytical queries",
            "Built incremental ETL processes with zero downtime",
            "Improved query performance by 70% with proper indexing",
          ],
          tags: ["Snowflake", "dbt", "Python", "AWS"],
        },
      ],
      about: {
        title: "Transforming data into strategic insights",
        paragraphs: [
          `I'm ${displayName}, a data engineer focused on building reliable, scalable data infrastructure. I specialize in designing data pipelines that enable data-driven decision making.`,
          "My work involves processing large-scale datasets, ensuring data quality, and building analytics platforms that empower teams to make informed decisions.",
          "I'm passionate about data engineering best practices, performance optimization, and creating systems that handle growth gracefully.",
        ],
        principles: [
          {
            title: "Data quality",
            description: "Ensuring accuracy, completeness, and reliability of data through validation and monitoring.",
          },
          {
            title: "Scalability",
            description: "Designing systems that can handle increasing data volumes and complexity.",
          },
          {
            title: "Automation",
            description: "Building automated pipelines and monitoring to reduce manual work and errors.",
          },
        ],
      },
      architecture: {
        pillars: [
          {
            title: "Data pipeline design",
            points: [
              "Idempotent ETL processes with error handling",
              "Incremental processing for efficiency",
              "Data lineage and documentation",
            ],
          },
          {
            title: "Data storage",
            points: [
              "Optimized schemas for analytical workloads",
              "Partitioning and indexing strategies",
              "Data retention and archival policies",
            ],
          },
          {
            title: "Monitoring & reliability",
            points: [
              "Data quality checks and alerting",
              "Pipeline monitoring and observability",
              "Disaster recovery and backup strategies",
            ],
          },
        ],
      },
    },
    {
      role: "Mobile App Developer",
      location: "Austin, TX",
      headline: `${displayName} — Mobile App Developer`,
      subheadline: `iOS and Android developer creating engaging mobile experiences. Expert in native and cross-platform development with focus on performance and user experience.`,
      highlights: [
        "Native iOS and Android development",
        "Cross-platform frameworks like React Native and Flutter",
        "Mobile UI/UX design and performance optimization",
      ],
      skills: [
        {
          group: "Mobile Development",
          items: ["Swift", "Kotlin", "React Native", "Flutter", "iOS", "Android"],
        },
        {
          group: "Backend Integration",
          items: ["REST APIs", "GraphQL", "Firebase", "AWS Amplify", "WebSockets"],
        },
        {
          group: "Tools & Testing",
          items: ["Xcode", "Android Studio", "Jest", "Detox", "Fastlane", "CI/CD"],
        },
      ],
      experience: [
        {
          title: "Senior Mobile Developer",
          company: "MobileFirst Solutions",
          location: "Austin, TX",
          period: "2021 - Present",
          bullets: [
            "Developed iOS and Android apps with 500K+ downloads",
            "Improved app performance reducing crash rate by 80%",
            "Led migration to React Native reducing codebase by 40%",
          ],
          tech: ["React Native", "Swift", "Kotlin", "Firebase", "GraphQL"],
        },
        {
          title: "Mobile Developer",
          company: "AppWorks",
          location: "Remote",
          period: "2019 - 2021",
          bullets: [
            "Built native iOS apps using Swift and UIKit",
            "Implemented offline-first architecture with local caching",
            "Collaborated with designers on UI/UX implementation",
          ],
          tech: ["Swift", "iOS", "Core Data", "REST APIs"],
        },
      ],
      projects: [
        {
          title: "Fitness Tracking App",
          summary: "Cross-platform fitness app with workout tracking and social features",
          bullets: [
            "Built with React Native for iOS and Android",
            "Integrated health APIs and wearable device support",
            "Achieved 4.8+ app store rating with 100K+ active users",
          ],
          tags: ["React Native", "Firebase", "HealthKit", "GraphQL"],
        },
        {
          title: "E-Commerce Mobile App",
          summary: "Native iOS shopping app with AR try-on features",
          bullets: [
            "Developed using Swift and ARKit for virtual try-on",
            "Implemented secure payment processing with Apple Pay",
            "Optimized for performance with lazy loading and caching",
          ],
          tags: ["Swift", "ARKit", "Core Data", "Stripe"],
        },
      ],
      about: {
        title: "Creating delightful mobile experiences",
        paragraphs: [
          `I'm ${displayName}, a mobile app developer passionate about creating intuitive, performant mobile applications. I specialize in both native and cross-platform development.`,
          "My focus is on building apps that users love—combining smooth performance, beautiful design, and thoughtful user experience. I stay current with mobile platform updates and best practices.",
          "I enjoy the challenge of optimizing for different devices and platforms while maintaining code quality and developer experience.",
        ],
        principles: [
          {
            title: "User experience",
            description: "Creating intuitive interfaces with smooth animations and responsive interactions.",
          },
          {
            title: "Performance",
            description: "Optimizing apps for speed, battery efficiency, and smooth 60fps animations.",
          },
          {
            title: "Code quality",
            description: "Writing maintainable, testable code with clear architecture patterns.",
          },
        ],
      },
      architecture: {
        pillars: [
          {
            title: "App architecture",
            points: [
              "MVVM and Clean Architecture patterns",
              "State management and data flow",
              "Dependency injection and modular design",
            ],
          },
          {
            title: "Performance optimization",
            points: [
              "Image optimization and lazy loading",
              "Memory management and leak prevention",
              "Network request optimization and caching",
            ],
          },
          {
            title: "Platform integration",
            points: [
              "Native APIs and platform-specific features",
              "Push notifications and background processing",
              "Deep linking and app navigation",
            ],
          },
        ],
      },
    },
    {
      role: "DevOps Engineer",
      location: "Seattle, WA",
      headline: `${displayName} — DevOps Engineer`,
      subheadline: `DevOps engineer automating infrastructure, improving deployment pipelines, and ensuring system reliability. Expert in cloud platforms, containerization, and infrastructure as code.`,
      highlights: [
        "Cloud infrastructure and automation",
        "CI/CD pipelines and deployment strategies",
        "Monitoring, observability, and incident response",
      ],
      skills: [
        {
          group: "Cloud Platforms",
          items: ["AWS", "GCP", "Azure", "Terraform", "CloudFormation", "Kubernetes"],
        },
        {
          group: "CI/CD & Automation",
          items: ["Jenkins", "GitLab CI", "GitHub Actions", "Ansible", "Puppet", "Bash"],
        },
        {
          group: "Monitoring & Tools",
          items: ["Prometheus", "Grafana", "ELK Stack", "Docker", "Linux", "Python"],
        },
      ],
      experience: [
        {
          title: "Senior DevOps Engineer",
          company: "CloudScale Technologies",
          location: "Seattle, WA",
          period: "2020 - Present",
          bullets: [
            "Reduced deployment time from 2 hours to 15 minutes",
            "Implemented infrastructure as code reducing manual errors by 90%",
            "Built monitoring and alerting reducing MTTR by 60%",
          ],
          tech: ["AWS", "Kubernetes", "Terraform", "Jenkins", "Prometheus"],
        },
        {
          title: "DevOps Engineer",
          company: "TechOps Solutions",
          location: "Portland, OR",
          period: "2018 - 2020",
          bullets: [
            "Migrated infrastructure to AWS reducing costs by 40%",
            "Automated deployment pipelines for multiple environments",
            "Implemented containerization strategy with Docker and Kubernetes",
          ],
          tech: ["AWS", "Docker", "Kubernetes", "Ansible", "Python"],
        },
      ],
      projects: [
        {
          title: "Infrastructure as Code Migration",
          summary: "Migrated entire infrastructure to Terraform with automated provisioning",
          bullets: [
            "Converted 50+ servers to Terraform-managed infrastructure",
            "Implemented GitOps workflow for infrastructure changes",
            "Reduced provisioning time from days to minutes",
          ],
          tags: ["Terraform", "AWS", "GitLab CI", "Ansible"],
        },
        {
          title: "Kubernetes Cluster Setup",
          summary: "Designed and deployed production Kubernetes cluster with high availability",
          bullets: [
            "Multi-AZ cluster setup with auto-scaling",
            "Implemented service mesh with Istio",
            "Set up monitoring, logging, and alerting stack",
          ],
          tags: ["Kubernetes", "AWS EKS", "Istio", "Prometheus", "Grafana"],
        },
      ],
      about: {
        title: "Automating infrastructure for scale and reliability",
        paragraphs: [
          `I'm ${displayName}, a DevOps engineer focused on building reliable, scalable infrastructure. I specialize in cloud platforms, automation, and improving developer workflows.`,
          "My work involves designing infrastructure that scales, automating repetitive tasks, and ensuring systems are observable and maintainable. I believe in infrastructure as code and continuous improvement.",
          "I'm passionate about reducing toil, improving deployment velocity, and building systems that teams can rely on.",
        ],
        principles: [
          {
            title: "Automation",
            description: "Eliminating manual work through scripting, infrastructure as code, and CI/CD.",
          },
          {
            title: "Reliability",
            description: "Building resilient systems with monitoring, alerting, and disaster recovery.",
          },
          {
            title: "Developer experience",
            description: "Improving workflows to enable faster, safer deployments.",
          },
        ],
      },
      architecture: {
        pillars: [
          {
            title: "Infrastructure as code",
            points: [
              "Version-controlled infrastructure with Terraform",
              "Reproducible environments and configurations",
              "Automated provisioning and updates",
            ],
          },
          {
            title: "CI/CD pipelines",
            points: [
              "Automated testing and deployment workflows",
              "Multi-environment promotion strategies",
              "Rollback and canary deployment capabilities",
            ],
          },
          {
            title: "Observability",
            points: [
              "Comprehensive monitoring and alerting",
              "Centralized logging and tracing",
              "Performance metrics and dashboards",
            ],
          },
        ],
      },
    },
    {
      role: "UI/UX Designer & Frontend Developer",
      location: "Los Angeles, CA",
      headline: `${displayName} — UI/UX Designer & Frontend Developer`,
      subheadline: `Creative designer and frontend developer combining visual design with code. Creating beautiful, accessible interfaces that users love.`,
      highlights: [
        "User-centered design and prototyping",
        "Modern frontend development with React",
        "Design systems and component libraries",
      ],
      skills: [
        {
          group: "Design Tools",
          items: ["Figma", "Adobe XD", "Sketch", "Illustrator", "Photoshop", "Prototyping"],
        },
        {
          group: "Frontend Development",
          items: ["React", "TypeScript", "CSS", "Sass", "Tailwind CSS", "Next.js"],
        },
        {
          group: "Design Principles",
          items: ["User Research", "Wireframing", "Design Systems", "Accessibility", "Responsive Design"],
        },
      ],
      experience: [
        {
          title: "Senior UI/UX Designer & Developer",
          company: "Creative Digital Agency",
          location: "Los Angeles, CA",
          period: "2020 - Present",
          bullets: [
            "Designed and developed 20+ client websites and web applications",
            "Created design system used across 5 product teams",
            "Improved conversion rates by 35% through UX improvements",
          ],
          tech: ["Figma", "React", "TypeScript", "Tailwind CSS", "Next.js"],
        },
        {
          title: "UI Designer & Frontend Developer",
          company: "Design Studio",
          location: "San Diego, CA",
          period: "2018 - 2020",
          bullets: [
            "Designed user interfaces for mobile and web applications",
            "Implemented responsive designs with modern CSS frameworks",
            "Collaborated with clients to translate requirements into designs",
          ],
          tech: ["Sketch", "React", "CSS", "Sass"],
        },
      ],
      projects: [
        {
          title: "Design System & Component Library",
          summary: "Comprehensive design system with React component library",
          bullets: [
            "Created design tokens and component documentation",
            "Built reusable React components with Storybook",
            "Adopted by multiple teams reducing design inconsistencies",
          ],
          tags: ["Figma", "React", "Storybook", "TypeScript", "Design Systems"],
        },
        {
          title: "E-Commerce Website Redesign",
          summary: "Complete redesign improving user experience and conversion",
          bullets: [
            "Conducted user research and created user personas",
            "Designed new interface with improved navigation and checkout flow",
            "Implemented responsive design with mobile-first approach",
          ],
          tags: ["Figma", "React", "Next.js", "Tailwind CSS", "User Research"],
        },
      ],
      about: {
        title: "Designing experiences that users love",
        paragraphs: [
          `I'm ${displayName}, a UI/UX designer and frontend developer who bridges the gap between design and code. I create beautiful, functional interfaces that solve real user problems.`,
          "My process combines user research, thoughtful design, and clean code. I believe great design is invisible—it guides users naturally and makes complex tasks feel simple.",
          "I'm passionate about accessibility, design systems, and creating experiences that work beautifully across all devices and users.",
        ],
        principles: [
          {
            title: "User-centered design",
            description: "Designing with users in mind through research, testing, and iteration.",
          },
          {
            title: "Accessibility",
            description: "Creating inclusive designs that work for all users, regardless of ability.",
          },
          {
            title: "Design + code",
            description: "Combining design skills with frontend development for pixel-perfect implementation.",
          },
        ],
      },
      architecture: {
        pillars: [
          {
            title: "Design process",
            points: [
              "User research and persona development",
              "Wireframing and prototyping",
              "Usability testing and iteration",
            ],
          },
          {
            title: "Design systems",
            points: [
              "Consistent design tokens and components",
              "Reusable patterns and guidelines",
              "Documentation and maintenance",
            ],
          },
          {
            title: "Frontend implementation",
            points: [
              "Semantic HTML and accessible markup",
              "Responsive CSS and modern frameworks",
              "Performance optimization and best practices",
            ],
          },
        ],
      },
    },
  ];

  const profile = profiles[profileIndex];

  // 1. PersonInfo
  await prisma.personInfo.upsert({
    where: { portfolioId },
    update: {},
    create: {
      portfolioId,
      name: displayName,
      role: profile.role,
      location: profile.location,
      email: userEmail,
      linkedIn: `https://www.linkedin.com/in/${emailPrefix}/`,
    },
  });

  // 2. HeroContent
  await prisma.heroContent.upsert({
    where: { portfolioId },
    update: {},
    create: {
      portfolioId,
      headline: profile.headline,
      subheadline: profile.subheadline,
      highlights: JSON.stringify(profile.highlights),
    },
  });

  // 3. Skills
  const skillGroups = await prisma.skillGroup.findMany({
    where: { portfolioId },
  });

  if (skillGroups.length === 0) {
    for (let i = 0; i < profile.skills.length; i++) {
      const group = profile.skills[i];
      const skillGroup = await prisma.skillGroup.create({
        data: {
          portfolioId,
          name: group.group,
          order: i,
        },
      });

      for (let j = 0; j < group.items.length; j++) {
        await prisma.skill.create({
          data: {
            skillGroupId: skillGroup.id,
            name: group.items[j],
            order: j,
          },
        });
      }
    }
  }

  // 4. Experience
  const existingExperience = await prisma.experience.findMany({
    where: { portfolioId },
  });

  if (existingExperience.length === 0) {
    for (let i = 0; i < profile.experience.length; i++) {
      const role = profile.experience[i];
      const experience = await prisma.experience.create({
        data: {
          portfolioId,
          title: role.title,
          company: role.company,
          location: role.location,
          period: role.period,
          order: i,
        },
      });

      for (let j = 0; j < role.bullets.length; j++) {
        await prisma.experienceBullet.create({
          data: {
            experienceId: experience.id,
            text: role.bullets[j],
            order: j,
          },
        });
      }

      for (let j = 0; j < role.tech.length; j++) {
        await prisma.experienceTech.create({
          data: {
            experienceId: experience.id,
            name: role.tech[j],
            order: j,
          },
        });
      }
    }
  }

  // 5. Projects
  const existingProjects = await prisma.project.findMany({
    where: { portfolioId },
  });

  if (existingProjects.length === 0) {
    for (let i = 0; i < profile.projects.length; i++) {
      const project = profile.projects[i];
      const dbProject = await prisma.project.create({
        data: {
          portfolioId,
          title: project.title,
          summary: project.summary,
          order: i,
        },
      });

      for (let j = 0; j < project.bullets.length; j++) {
        await prisma.projectBullet.create({
          data: {
            projectId: dbProject.id,
            text: project.bullets[j],
            order: j,
          },
        });
      }

      for (let j = 0; j < project.tags.length; j++) {
        await prisma.projectTag.create({
          data: {
            projectId: dbProject.id,
            name: project.tags[j],
            order: j,
          },
        });
      }
    }
  }

  // 6. AboutContent
  const existingAbout = await prisma.aboutContent.findUnique({
    where: { portfolioId },
  });

  if (!existingAbout) {
    const aboutContent = await prisma.aboutContent.create({
      data: {
        portfolioId,
        title: profile.about.title,
        paragraphs: JSON.stringify(profile.about.paragraphs),
      },
    });

    for (let i = 0; i < profile.about.principles.length; i++) {
      const principle = profile.about.principles[i];
      await prisma.aboutPrinciple.create({
        data: {
          aboutContentId: aboutContent.id,
          title: principle.title,
          description: principle.description,
          order: i,
        },
      });
    }
  }

  // 7. ArchitectureContent
  const existingArchitecture = await prisma.architectureContent.findUnique({
    where: { portfolioId },
  });

  if (!existingArchitecture) {
    const architectureContent = await prisma.architectureContent.create({
      data: {
        portfolioId,
      },
    });

    for (let i = 0; i < profile.architecture.pillars.length; i++) {
      const pillar = profile.architecture.pillars[i];
      const dbPillar = await prisma.architecturePillar.create({
        data: {
          architectureContentId: architectureContent.id,
          title: pillar.title,
          order: i,
        },
      });

      for (let j = 0; j < pillar.points.length; j++) {
        await prisma.architecturePoint.create({
          data: {
            architecturePillarId: dbPillar.id,
            text: pillar.points[j],
            order: j,
          },
        });
      }
    }
  }

  console.log(`  ✓ Unique portfolio data created for ${displayName} (${profile.role})`);
}

async function main() {
  console.log("🌱 Seeding unique portfolio data for all regular users...\n");

  // Find all users except super_admin
  const regularUsers = await prisma.adminUser.findMany({
    where: {
      role: { not: "super_admin" },
    },
    include: {
      portfolio: {
        select: {
          id: true,
          slug: true,
        },
      },
    },
  });

  if (regularUsers.length === 0) {
    console.log("No regular users found. Skipping seed.");
    return;
  }

  console.log(`Found ${regularUsers.length} regular user(s):\n`);

  for (let i = 0; i < regularUsers.length; i++) {
    const user = regularUsers[i];
    console.log(`Processing user: ${user.email} (${user.name || "no name"})`);

    // Ensure portfolio exists
    let portfolioId: string;
    if (user.portfolio) {
      portfolioId = user.portfolio.id;
      console.log(`  Portfolio exists: ${user.portfolio.slug || user.portfolio.id}`);
      
      // Delete existing portfolio data to regenerate with unique content
      console.log(`  Clearing existing data for fresh unique content...`);
      await prisma.personInfo.deleteMany({ where: { portfolioId } });
      await prisma.heroContent.deleteMany({ where: { portfolioId } });
      await prisma.skillGroup.deleteMany({ where: { portfolioId } });
      await prisma.experience.deleteMany({ where: { portfolioId } });
      await prisma.project.deleteMany({ where: { portfolioId } });
      await prisma.aboutContent.deleteMany({ where: { portfolioId } });
      await prisma.architectureContent.deleteMany({ where: { portfolioId } });
    } else {
      const slug = user.email.split("@")[0] || `user-${user.id.slice(0, 8)}`;
      const portfolio = await prisma.portfolio.create({
        data: {
          userId: user.id,
          slug,
          isPublished: false,
        },
      });
      portfolioId = portfolio.id;
      console.log(`  Created portfolio: ${slug}`);
    }

    // Seed unique portfolio data (pass user index to ensure variety)
    await seedPortfolioData(portfolioId, user.email, user.name, i);
    console.log("");
  }

  console.log("✅ Unique portfolio data seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding portfolio data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
