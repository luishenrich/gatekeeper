"use client";

import { AlertTriangle, ChevronDown, Loader2, RotateCw } from "lucide-react";
import {
  forwardRef,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import {
  Dialog as UiDialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch as UiSwitch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { focusRing } from "./tokens";

export { focusRing };

/* ---------- Button ---------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accept" | "ask" | "lilac";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-foreground text-background hover:bg-foreground/85",
  lilac: "bg-card text-foreground border border-foreground hover:bg-accent",
  secondary: "bg-card text-foreground border border-border hover:bg-accent",
  ghost: "bg-transparent text-foreground/80 hover:bg-foreground/5 hover:text-foreground",
  danger: "bg-red-600 text-white hover:bg-red-700",
  accept: "bg-green-600 text-white hover:bg-green-700",
  ask: "bg-orange-500 text-white hover:bg-orange-600",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[14px] gap-1.5",
  md: "h-10 px-4 text-[15px] gap-2",
  lg: "h-12 px-6 text-[16px] gap-2.5",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, icon, className, children, disabled, type, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap rounded-full font-medium transition-colors duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
        focusRing,
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : icon}
      {children}
    </button>
  );
});

/* ---------- Form fields ---------- */

type FieldShellProps = {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  trailing?: ReactNode;
  children: ReactNode;
};

function FieldShell({ id, label, hint, error, required, trailing, children }: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[14px] font-medium text-foreground">
          {label}
          {required ? <span className="text-rose-600"> *</span> : null}
        </label>
        {trailing}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-[13px] font-medium text-rose-700">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const controlClass = (error?: string | null) =>
  cn(
    "w-full rounded-xl border bg-card px-3.5 text-[15px] text-foreground shadow-[0_1px_0_rgba(0,0,0,0.02)] placeholder:text-muted-foreground/80 transition-colors duration-150 disabled:opacity-60",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-foreground/10 focus-visible:border-foreground/50",
    error ? "border-rose-500" : "border-input hover:border-foreground/25"
  );

type FieldExtras = { label: string; hint?: ReactNode; error?: string | null; trailing?: ReactNode };

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldExtras>(
  function Input({ label, hint, error, trailing, id, className, required, ...rest }, ref) {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <FieldShell id={fid} label={label} hint={hint} error={error} required={required} trailing={trailing}>
        <input
          ref={ref}
          id={fid}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
          className={cn(controlClass(error), "h-11", className)}
          {...rest}
        />
      </FieldShell>
    );
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & FieldExtras>(
  function Textarea({ label, hint, error, trailing, id, className, required, ...rest }, ref) {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <FieldShell id={fid} label={label} hint={hint} error={error} required={required} trailing={trailing}>
        <textarea
          ref={ref}
          id={fid}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
          className={cn(controlClass(error), "min-h-[8rem] py-3 leading-relaxed", className)}
          {...rest}
        />
      </FieldShell>
    );
  }
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & FieldExtras>(
  function Select({ label, hint, error, trailing, id, className, required, children, ...rest }, ref) {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <FieldShell id={fid} label={label} hint={hint} error={error} required={required} trailing={trailing}>
        <div className="relative">
          <select
            ref={ref}
            id={fid}
            required={required}
            aria-invalid={error ? true : undefined}
            className={cn(controlClass(error), "h-11 appearance-none pr-10", className)}
            {...rest}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        </div>
      </FieldShell>
    );
  }
);

/* ---------- Surfaces ---------- */

export function Card({ className, children, as: Tag = "div" }: { className?: string; children: ReactNode; as?: "div" | "section" | "article" }) {
  return (
    <Tag className={cn("rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(26,26,26,0.04),0_8px_24px_-12px_rgba(26,26,26,0.08)]", className)}>
      {children}
    </Tag>
  );
}

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium leading-5", className ?? "bg-muted text-foreground/80")}>
      {children}
    </span>
  );
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-border bg-card px-1.5 font-mono text-[11px] font-medium text-muted-foreground shadow-[0_1px_0_hsl(var(--border))]", className)}>
      {children}
    </kbd>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("gk-shimmer rounded-xl bg-muted", className)} />;
}

export function Avatar({ label, size = "md", className }: { label: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: "h-8 w-8 text-[12px]", md: "h-10 w-10 text-[13px]", lg: "h-14 w-14 text-lg" };
  return (
    <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-full bg-foreground font-semibold text-background", sizes[size], className)}>
      {label}
    </span>
  );
}

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <div className="mb-2 text-[13px] font-medium uppercase tracking-wider text-muted-foreground">{eyebrow}</div> : null}
        <h1 className="font-display text-4xl leading-[1.05] text-foreground sm:text-5xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-[16px] text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "neutral" | "accept" | "ask" | "decline" | "blocklist";
}) {
  const dot = {
    neutral: "bg-foreground/40",
    accept: "bg-green-600",
    ask: "bg-orange-500",
    decline: "bg-red-600",
    blocklist: "bg-red-600",
  } as const;
  return (
    <Card className={cn("p-5", tone === "blocklist" && "bg-red-50 border-red-200")}>
      <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
        <span className={cn("h-1.5 w-1.5 rounded-full", dot[tone])} aria-hidden />
        {icon}
        {label}
      </div>
      <div className="mt-3 font-display text-5xl leading-none tabular-nums text-foreground">{value}</div>
      {hint ? <div className="mt-2 text-[13px] text-muted-foreground">{hint}</div> : null}
    </Card>
  );
}

/* ---------- States ---------- */

export function EmptyState({ icon, title, body, action, className }: { icon?: ReactNode; title: string; body?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-16 text-center", className)}>
      {icon ? <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-muted text-foreground">{icon}</div> : null}
      <h2 className="font-display text-3xl text-foreground">{title}</h2>
      {body ? <div className="mt-2 max-w-md text-muted-foreground">{body}</div> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  details,
  onRetry,
  retrying,
  className,
}: {
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div role="alert" className={cn("rounded-2xl border border-red-200 bg-red-50 p-6", className)}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="font-medium text-rose-950">{title}</h2>
          <p className="mt-1 text-[15px] text-rose-900/90">{message}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {onRetry ? (
              <Button variant="secondary" size="sm" onClick={onRetry} loading={retrying} icon={<RotateCw className="h-3.5 w-3.5" aria-hidden />}>
                Try again
              </Button>
            ) : null}
            {details ? (
              <button type="button" onClick={() => setOpen((v) => !v)} className={cn("text-[13px] font-medium text-rose-900 underline underline-offset-2", focusRing)} aria-expanded={open}>
                {open ? "Hide details" : "Show details"}
              </button>
            ) : null}
          </div>
          {open && details ? (
            <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-card p-3 font-mono text-[12px] text-foreground/80">{details}</pre>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ---------- Switch ---------- */

export function Switch({
  checked,
  onChange,
  label,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  id?: string;
}) {
  return <UiSwitch id={id} checked={checked} onCheckedChange={onChange} aria-label={label} disabled={disabled} />;
}

/* ---------- SegmentedControl ---------- */

export type Segment<T extends string> = { value: T; label: ReactNode; count?: number; className?: string };

export function SegmentedControl<T extends string>({
  value,
  onChange,
  segments,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  segments: Segment<T>[];
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-full border border-border bg-muted/70 p-1", className)}>
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(s.value)}
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-full px-3.5 text-[14px] font-medium transition-colors duration-150",
              focusRing,
              active ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {s.label}
            {typeof s.count === "number" ? (
              <span className={cn("rounded-full px-1.5 text-[12px] tabular-nums", active ? s.className ?? "bg-foreground text-background" : "bg-foreground/5 text-muted-foreground")}>
                {s.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Dialog ---------- */

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <UiDialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="rounded-2xl border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-normal">{title}</DialogTitle>
          <DialogDescription asChild>
            <div className="text-[15px] text-muted-foreground">{children}</div>
          </DialogDescription>
        </DialogHeader>
        {footer ? <DialogFooter className="gap-2">{footer}</DialogFooter> : null}
      </DialogContent>
    </UiDialog>
  );
}
