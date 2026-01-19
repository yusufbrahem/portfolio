import { Container } from "@/components/container";
import Link from "next/link";
import { Code, FolderOpen, Briefcase, User, Building2, Mail, Home } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [skillsCount, projectsCount, experienceCount, aboutContent, architectureContent, personInfo] = await Promise.all([
    prisma.skill.count(),
    prisma.project.count(),
    prisma.experience.count(),
    prisma.aboutContent.findFirst(),
    prisma.architectureContent.findFirst(),
    prisma.personInfo.findFirst(),
  ]);

  const principlesCount = aboutContent
    ? await prisma.aboutPrinciple.count({ where: { aboutContentId: aboutContent.id } })
    : 0;
  const pillarsCount = architectureContent
    ? await prisma.architecturePillar.count({ where: { architectureContentId: architectureContent.id } })
    : 0;

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted">Manage your portfolio content</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/skills"
            className="border border-border bg-panel rounded-lg p-6 hover:bg-panel2 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <Code className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">Skills</h2>
            </div>
            <p className="text-sm text-muted">{skillsCount} skills</p>
          </Link>

          <Link
            href="/admin/projects"
            className="border border-border bg-panel rounded-lg p-6 hover:bg-panel2 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <FolderOpen className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">Projects</h2>
            </div>
            <p className="text-sm text-muted">{projectsCount} projects</p>
          </Link>

          <Link
            href="/admin/experience"
            className="border border-border bg-panel rounded-lg p-6 hover:bg-panel2 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">Experience</h2>
            </div>
            <p className="text-sm text-muted">{experienceCount} entries</p>
          </Link>

          <Link
            href="/admin/about"
            className="border border-border bg-panel rounded-lg p-6 hover:bg-panel2 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <User className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">About</h2>
            </div>
            <p className="text-sm text-muted">
              {aboutContent ? `${principlesCount} principles` : "Not configured"}
            </p>
          </Link>

          <Link
            href="/admin/architecture"
            className="border border-border bg-panel rounded-lg p-6 hover:bg-panel2 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">Architecture</h2>
            </div>
            <p className="text-sm text-muted">
              {architectureContent ? `${pillarsCount} pillars` : "Not configured"}
            </p>
          </Link>

          <Link
            href="/admin/contact"
            className="border border-border bg-panel rounded-lg p-6 hover:bg-panel2 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <Mail className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-foreground">Contact</h2>
            </div>
            <p className="text-sm text-muted">
              {personInfo ? "Configured" : "Not configured"}
            </p>
          </Link>
        </div>
      </div>
    </Container>
  );
}
