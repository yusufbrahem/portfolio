import { Container } from "@/components/container";
import { Section } from "@/components/section";
import { Card, Pill, PrimaryButton, SecondaryButton } from "@/components/ui";

type Block = { componentKey: string; order: number; data: unknown };

function getDisabledFields(data: Record<string, unknown>): string[] {
  const v = data["_disabledFields"];
  return Array.isArray(v) ? v.filter((k) => typeof k === "string") : [];
}

function isFieldDisabled(data: Record<string, unknown>, key: string): boolean {
  return getDisabledFields(data).includes(key);
}

function normalizePublicItems(data: Record<string, unknown>): { value: string; visible: boolean }[] {
  const raw = data.items;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((it) => {
      if (it && typeof it === "object" && "value" in it) {
        const o = it as { value: string; visible?: boolean };
        return { value: String(o.value ?? ""), visible: o.visible !== false };
      }
      return { value: String(it ?? ""), visible: true };
    })
    .filter((x) => x.visible && x.value);
}

export function MenuBlockRenderer({
  menuKey,
  menuLabel,
  blocks,
}: {
  menuKey: string;
  menuLabel: string;
  blocks: Block[];
}) {
  if (blocks.length === 0) return null;

  const firstTitle = blocks.find(
    (b) =>
      b.componentKey === "title" &&
      !isFieldDisabled((b.data as Record<string, unknown>) || {}, "text")
  );
  const sectionTitle =
    (firstTitle?.data as Record<string, unknown>)?.text as string || menuLabel;

  return (
    <Container id={menuKey}>
      <Section eyebrow={menuLabel} title={sectionTitle} description="">
        <div className="space-y-6">
          {blocks.map((block, idx) => (
            <PublicBlock key={idx} block={block} />
          ))}
        </div>
      </Section>
    </Container>
  );
}

function PublicBlock({ block }: { block: Block }) {
  const data = (block.data as Record<string, unknown>) || {};
  switch (block.componentKey) {
    case "title":
      if (isFieldDisabled(data, "text")) return null;
      return (
        <h2 className="text-2xl font-semibold text-foreground text-safe">
          {(data.text as string) || ""}
        </h2>
      );
    case "subtitle":
      if (isFieldDisabled(data, "text")) return null;
      return (
        <p className="text-base leading-relaxed text-muted text-safe">
          {(data.text as string) || ""}
        </p>
      );
    case "rich_text":
      if (isFieldDisabled(data, "content")) return null;
      return (
        <div
          className="text-base leading-relaxed text-muted text-safe prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{
            __html: ((data.content as string) || "").replace(/\n/g, "<br />"),
          }}
        />
      );
    case "pill_list": {
      if (isFieldDisabled(data, "items")) return null;
      const items = normalizePublicItems(data);
      if (items.length === 0) return null;
      return (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <Pill key={i}>{item.value}</Pill>
          ))}
        </div>
      );
    }
    case "contact_block": {
      const name = !isFieldDisabled(data, "name") ? ((data.name as string) || "") : "";
      const email = !isFieldDisabled(data, "email") ? ((data.email as string) || "") : "";
      const phone = !isFieldDisabled(data, "phone") ? ((data.phone as string) || "") : "";
      const message = !isFieldDisabled(data, "message") ? ((data.message as string) || "") : "";
      const hasAny = name || email || phone;
      if (!hasAny) return null;
      return (
        <Card className="p-6">
          {message && <p className="text-sm text-muted text-safe mb-4">{message}</p>}
          <div className="space-y-3">
            {name && <p className="font-medium text-foreground text-safe">{name}</p>}
            {email && (
              <div className="space-y-2">
                <a href={`mailto:${email}`} className="text-sm text-accent hover:underline block">
                  {email}
                </a>
                <PrimaryButton href={`mailto:${email}`}>Email</PrimaryButton>
              </div>
            )}
            {phone && (
              <a href={`tel:${phone}`} className="text-sm text-muted hover:underline block">
                {phone}
              </a>
            )}
          </div>
        </Card>
      );
    }
    case "pillar_card": {
      const title = !isFieldDisabled(data, "title") ? ((data.title as string) || "") : "";
      const description = !isFieldDisabled(data, "description") ? ((data.description as string) || "") : "";
      if (!title && !description) return null;
      return (
        <Card className="p-5">
          {title && <p className="text-sm font-semibold text-foreground text-safe">{title}</p>}
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-muted text-safe">{description}</p>
          )}
        </Card>
      );
    }
    case "file_link": {
      const rawItems = data.items;
      const entries: { title: string; href: string; isExternal: boolean }[] = [];
      if (Array.isArray(rawItems) && rawItems.length > 0) {
        for (const it of rawItems) {
          if (!it || typeof it !== "object" || (it as { visible?: boolean }).visible === false) continue;
          const o = it as { title?: string; type?: string; fileUrl?: string; externalUrl?: string };
          const title = (o.title && String(o.title).trim()) || "";
          const type = o.type === "upload" ? "upload" : "link";
          const fileUrl = (o.fileUrl && String(o.fileUrl).trim()) || "";
          const externalUrl = (o.externalUrl && String(o.externalUrl).trim()) || "";
          const href = type === "upload" ? fileUrl : externalUrl;
          if (title && href) entries.push({ title, href, isExternal: type === "link" });
        }
      } else {
        if (!isFieldDisabled(data, "title") && !isFieldDisabled(data, "fileUrl") && !isFieldDisabled(data, "externalUrl")) {
          const title = (data.title as string) || "";
          const type = (data.type as string) ?? "link";
          const fileUrl = (data.fileUrl as string) || "";
          const externalUrl = (data.externalUrl as string) || "";
          const href = type === "upload" ? fileUrl : externalUrl;
          if (title && href) entries.push({ title, href, isExternal: type === "link" });
        }
      }
      if (entries.length === 0) return null;
      return (
        <div className="space-y-4">
          {entries.map((entry, i) => (
            <Card key={i} className="p-5">
              <p className="text-sm font-semibold text-foreground text-safe mb-2">{entry.title}</p>
              {entry.isExternal ? (
                <PrimaryButton href={entry.href} target="_blank" rel="noopener noreferrer">
                  Open link
                </PrimaryButton>
              ) : (
                <SecondaryButton href={entry.href} target="_blank" rel="noopener noreferrer">
                  Download
                </SecondaryButton>
              )}
            </Card>
          ))}
        </div>
      );
    }
    case "card_grid": {
      if (isFieldDisabled(data, "items")) return null;
      const items = normalizePublicItems(data);
      if (items.length === 0) return null;
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <Card key={i} className="p-5">
              <p className="text-sm text-foreground text-safe">{item.value}</p>
            </Card>
          ))}
        </div>
      );
    }
    case "timeline": {
      if (isFieldDisabled(data, "items")) return null;
      const items = normalizePublicItems(data);
      if (items.length === 0) return null;
      return (
        <div className="space-y-4">
          {items.map((item, i) => (
            <Card key={i} className="p-5">
              <p className="text-sm text-foreground text-safe">{item.value}</p>
            </Card>
          ))}
        </div>
      );
    }
    default:
      return null;
  }
}
