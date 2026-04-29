import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "#/lib/utils";

type MarkdownProps = {
  children: string;
  className?: string;
};

const components: Components = {
  h1: ({ children, ...props }) => (
    <h1
      {...props}
      className="font-sans text-[32px] leading-[1.1] tracking-tight text-foreground mt-2 mb-5 first:mt-0"
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      {...props}
      className="font-sans text-[26px] leading-[1.15] tracking-tight text-foreground mt-9 mb-3.5 first:mt-0"
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      {...props}
      className="font-sans text-[15px] font-semibold tracking-wide uppercase text-foreground/90 mt-7 mb-2.5"
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4
      {...props}
      className="font-sans text-[13px] font-semibold tracking-[0.08em] uppercase text-muted-foreground mt-6 mb-2"
    >
      {children}
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5
      {...props}
      className="font-sans text-[12px] font-semibold tracking-widest uppercase text-muted-foreground mt-5 mb-1.5"
    >
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6
      {...props}
      className="font-sans text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/80 mt-5 mb-1.5"
    >
      {children}
    </h6>
  ),
  p: ({ children, ...props }) => (
    <p {...props} className="text-[14.5px] leading-[1.8] text-foreground/85 mb-4">
      {children}
    </p>
  ),
  a: ({ children, href, ...props }) => (
    <a
      {...props}
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      className="text-primary underline decoration-primary/30 underline-offset-[3px] decoration-1 transition-colors hover:decoration-primary"
    >
      {children}
    </a>
  ),
  strong: ({ children, ...props }) => (
    <strong {...props} className="font-semibold text-foreground">
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em {...props} className="font-serif italic text-foreground/95">
      {children}
    </em>
  ),
  ul: ({ children, ...props }) => (
    <ul
      {...props}
      className="mb-5 ml-1 space-y-1.5 text-[14.5px] leading-[1.75] text-foreground/85 [&_ul]:mt-1.5 [&_ul]:mb-0 [&_ol]:mt-1.5 [&_ol]:mb-0"
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol
      {...props}
      className="mb-5 ml-1 list-decimal space-y-1.5 pl-5 text-[14.5px] leading-[1.75] text-foreground/85 marker:text-muted-foreground/60 marker:text-[12px] [&_ol]:mt-1.5 [&_ol]:mb-0 [&_ul]:mt-1.5 [&_ul]:mb-0"
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li
      {...props}
      className="relative pl-5 [&>p]:mb-0 [&>p]:inline before:absolute before:left-0 before:top-[0.7em] before:h-[5px] before:w-[5px] before:rounded-full before:bg-primary/60 [[data-ordered=true]>&]:pl-1.5 [[data-ordered=true]>&]:before:hidden"
    >
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      {...props}
      className="my-6 border-l-2 border-primary/40 bg-primary/4 pl-5 pr-4 py-3 font-serif text-[18px] leading-[1.55] italic text-foreground/90 [&>p]:mb-0 [&>p]:text-[18px] [&>p]:leading-[1.55] [&>p]:font-serif [&>p]:italic [&>p]:text-foreground/90"
    >
      {children}
    </blockquote>
  ),
  hr: ({ ...props }) => (
    <hr
      {...props}
      className="my-8 border-0 h-px bg-linear-to-r from-transparent via-border to-transparent"
    />
  ),
  code: ({ className, children, ...props }) => {
    const isInline = !/language-/.test(className || "");
    if (isInline) {
      return (
        <code
          {...props}
          className="font-mono text-[12.5px] px-1.5 py-0.5 rounded-[4px] bg-secondary/60 border border-border/60 text-primary/90"
        >
          {children}
        </code>
      );
    }
    return (
      <code {...props} className={cn("font-mono text-[12.5px] leading-relaxed", className)}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre
      {...props}
      className="my-5 overflow-x-auto rounded-lg border border-border/70 bg-[#0a0a0e] px-4 py-3.5 text-[12.5px] leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] [&>code]:bg-transparent [&>code]:border-0 [&>code]:p-0 [&>code]:text-foreground/90"
    >
      {children}
    </pre>
  ),
  table: ({ children, ...props }) => (
    <div className="my-6 overflow-x-auto rounded-md border border-border">
      <table {...props} className="w-full border-collapse text-[13px] text-foreground/85">
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead
      {...props}
      className="bg-secondary/60 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
    >
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th {...props} className="px-3.5 py-2.5 text-left font-semibold border-b border-border">
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td {...props} className="px-3.5 py-2.5 border-b border-border/50 align-top">
      {children}
    </td>
  ),
  tr: ({ children, ...props }) => (
    <tr {...props} className="transition-colors hover:bg-secondary/30">
      {children}
    </tr>
  ),
  img: ({ alt, ...props }) => (
    <img {...props} alt={alt} className="my-5 rounded-md border border-border/70 max-w-full" />
  ),
  input: ({ type, checked, ...props }) => {
    if (type === "checkbox") {
      return (
        <span
          className={cn(
            "mr-2 inline-flex h-3.5 w-3.5 -translate-y-px items-center justify-center rounded-[3px] border align-middle",
            checked ? "border-primary bg-primary/20 text-primary" : "border-border bg-secondary/40",
          )}
        >
          {checked && (
            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-none stroke-current stroke-2">
              <path d="M2.5 6.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      );
    }
    return <input type={type} checked={checked} {...props} />;
  },
};

export const Markdown = memo(function Markdown({
  children,
  className,
  compact = false,
}: MarkdownProps & { compact?: boolean }) {
  return (
    <div
      className={cn(
        "font-sans text-foreground/85",
        compact &&
          "[&_h1]:text-[18px] [&_h1]:mt-3 [&_h1]:mb-2 [&_h2]:text-[16px] [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-[12px] [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h4]:text-[11px] [&_h4]:mt-2.5 [&_h4]:mb-1 [&_p]:text-[13px] [&_p]:leading-[1.65] [&_p]:mb-2.5 [&_ul]:mb-2.5 [&_ol]:mb-2.5 [&_ul]:text-[13px] [&_ol]:text-[13px] [&_ul]:space-y-1 [&_ol]:space-y-1 [&_li]:before:top-[0.6em] [&_blockquote]:my-3 [&_blockquote]:py-2 [&_blockquote]:text-[15px] [&_blockquote_p]:text-[15px] [&_pre]:my-3 [&_pre]:px-3 [&_pre]:py-2.5 [&_pre]:text-[12px] [&_code]:text-[11.5px] [&_table]:my-3 [&_table]:text-[12px] [&_hr]:my-4 *:first:mt-0 *:last:mb-0",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
});
