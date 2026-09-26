import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)} {...props} />;
}

export function PageHeader({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-default bg-surface-muted">
      <Container className="py-12 sm:py-16">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {intro && <p className="mt-3 max-w-2xl text-lg text-muted">{intro}</p>}
        {children}
      </Container>
    </div>
  );
}

export function SectionTitle({
  title,
  action,
  as: Tag = "h2",
}: {
  title: string;
  action?: ReactNode;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <Tag className="font-display text-2xl font-bold tracking-tight">{title}</Tag>
      {action}
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  secondary: "border border-default bg-card hover:bg-surface-muted",
  ghost: "hover:bg-surface-muted text-muted hover:text-fg",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button className={cn(buttonBase, buttonStyles[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  href,
  external,
  ...props
}: ComponentProps<"a"> & { variant?: ButtonVariant; href: string; external?: boolean }) {
  const cls = cn(buttonBase, buttonStyles[variant], className);
  if (external) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={cls} {...props} />;
  }
  return <Link href={href} className={cls} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl border border-default bg-card shadow-sm", className)}
      {...props}
    />
  );
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-default p-10 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  );
}

/* Form primitives */
const fieldBase =
  "block w-full rounded-md border border-default bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted/70 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("mb-1 block text-sm font-medium", className)} {...props} />;
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-28", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(fieldBase, className)} {...props} />;
}

export function Help({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-xs text-muted">{children}</p>;
}

export function Alert({
  kind = "info",
  children,
}: {
  kind?: "info" | "success" | "error";
  children: ReactNode;
}) {
  const styles = {
    info: "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
    success:
      "border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
    error: "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  }[kind];
  return (
    <div role={kind === "error" ? "alert" : "status"} className={cn("rounded-md border px-4 py-3 text-sm", styles)}>
      {children}
    </div>
  );
}
