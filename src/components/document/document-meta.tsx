import { Link as LinkIcon } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import { SourceLink } from "#/components/document/source-link";

type DocumentType = "web" | "pdf" | "note";

type DocumentMetaProps = {
  type: DocumentType;
  title: string;
  tags: string[];
  source?: string;
  creationTime: number;
  folder?: { name: string; color: string } | null;
};

const typeConfig: Record<DocumentType, { label: string; className: string }> = {
  web: {
    label: "Web",
    className: "bg-blue-500/15 text-blue-500 border border-blue-500/20",
  },
  pdf: {
    label: "PDF",
    className: "bg-red-500/15 text-red-500 border border-red-500/20",
  },
  note: {
    label: "Note",
    className: "bg-violet-400/15 text-violet-400 border border-violet-400/20",
  },
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function DocumentMeta({
  type,
  title,
  tags,
  source,
  creationTime,
  folder,
}: DocumentMetaProps) {
  const config = typeConfig[type];

  return (
    <div className="px-7 pt-5 pb-3 shrink-0">
      <div className="flex items-center gap-1.5 mb-2.5">
        {folder && (
          <span
            className="text-[11px] px-2.5 py-0.5 rounded font-medium"
            style={{
              backgroundColor: `${folder.color}18`,
              color: folder.color,
              border: `1px solid ${folder.color}30`,
            }}
          >
            {folder.name}
          </span>
        )}
        <span
          className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded uppercase ${config.className}`}
        >
          {config.label}
        </span>
      </div>

      <h1 className="text-[22px] font-extrabold tracking-tight leading-tight mb-2.5">
        {title}
      </h1>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="text-[11px] px-2 py-0 h-5 bg-secondary/50 text-muted-foreground border border-border"
          >
            #{tag}
          </Badge>
        ))}
      </div>

      {source && (
        <div className="flex items-center gap-1.5 text-muted-foreground text-[12px] min-w-0">
          <LinkIcon className="w-3 h-3 shrink-0" />
          <SourceLink url={source} />
          <span className="text-border shrink-0">·</span>
          <span className="shrink-0">{formatDate(creationTime)}</span>
        </div>
      )}
    </div>
  );
}
