import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

/**
 * Renders trusted-author markdown (posts, events, bios). react-markdown
 * does not render raw HTML by default, so pasted HTML is shown as text.
 */
export function Markdown({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("prose-acm", className)}>
      <ReactMarkdown
        components={{
          a: ({ href, children }) => {
            const external = href && /^https?:\/\//.test(href);
            return (
              <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {children}
              </a>
            );
          },
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" decoding="async" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
