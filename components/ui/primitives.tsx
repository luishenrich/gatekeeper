"use client";

import clsx from "clsx";
import { AlertTriangle, ChevronDown, Loader2, RotateCw, X } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import { focusRing } from "./tokens";

export { focusRing };

/* ---------- Button ---------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accept" | "ask";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-800 border-2 border-slate-900",
  secondary: "bg-white text-slate-900 border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50",
  ghost: "bg-transparent text-slate-700 border-2 border-transparent hover:bg-slate-100 hover:text-slate-900",
  danger: "bg-rose-600 text-white border-2 border-rose-600 hover:bg-rose-700",
  accept: "bg-emerald-600 text-white border-2 border-emerald-600 hover:bg-emerald-700",
  ask: "bg-amber-500 text-slate-950 border-2 border-amber-500 hover:bg-amber-400",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-[15px] gap-1.5 rounded-lg",
  md: "h-11 px-4 text-[17px] gap-2 rounded-xl",
  lg: "h-14 px-6 text-lg gap-2.5 rounded-xl",
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
      className={clsx(
        "inline-flex select-none items-center justify-center font-semibold transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60",
        focusRing,
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-[1.1em] w-[1.1em] animate-spin motion-reduce:animate-none" aria-hidden />
      ) : (
        icon
      )}
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
        <label htmlFor={id} className="font-semibold text-slate-900">
          {label}
          {required ? <span className="text-rose-700"> *</span> : null}
        </label>
        {trailing}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-[15px] font-medium text-rose-700">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[15px] text-slate-600">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const controlClass = (error?: string | null) =>
  clsx(
    "w-full rounded-xl border-2 bg-white px-4 text-[17px] text-slate-900 placeholder:text-slate-500 transition-colors duration-150",
    focusRing,
    error ? "border-rose-600" : "border-slate-200 hover:border-slate-300 focus-visible:border-slate-900"
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
          className={clsx(controlClass(error), "h-12", className)}
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
          className={clsx(controlClass(error), "min-h-[8rem] py-3 leading-relaxed", className)}
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
            className={clsx(controlClass(error), "h-12 appearance-none pr-10", className)}
            {...rest}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-600" aria-hidden />
        </div>
      </FieldShell>
    );
  }
);

/* ---------- Surfaces ---------- */

export function Card({ className, children, as: Tag = "div" }: { className?: string; children: ReactNode; as?: "div" | "section" | "article" }) {
  return <Tag className={clsx("rounded-2xl border-2 border-slate-200 bg-white", className)}>{children}</Tag>;
}

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[14px] font-semibold leading-6", className ?? "bg-slate-100 text-slate-800")}>
      {children}
    </span>
  );
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd className={clsx("inline-flex h-6 min-w-6 items-center justify-center rounded-md border-2 border-b-[3px] border-slate-300 bg-white px-1.5 font-mono text-[13px] font-semibold text-slate-700", className)}>
      {children}
    </kbd>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={clsx("gk-shimmer rounded-lg bg-slate-200", className)} />;
}

export function Avatar({ label, size = "md", className }: { label: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: "h-8 w-8 text-[13px]", md: "h-11 w-11 text-[15px]", lg: "h-16 w-16 text-xl" };
  return (
    <span aria-hidden className={clsx("grid shrink-0 place-items-center rounded-full bg-slate-800 font-bold text-white", sizes[size], className)}>
      {label}
    </span>
  );
}

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <div className="mb-2 text-[15px] font-semibold text-slate-600">{eyebrow}</div> : null}
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-lg text-slate-600">{description}</p> : null}
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
  const tones = {
    neutral: "border-slate-200 bg-white",
    accept: "border-emerald-600/40 bg-emerald-50",
    ask: "border-amber-500/50 bg-amber-50",
    decline: "border-rose-600/40 bg-rose-50",
    blocklist: "border-rose-600 bg-rose-50",
  } as const;
  return (
    <div className={clsx("rounded-2xl border-2 p-5", tones[tone])}>
      <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-700">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-4xl font-black tabular-nums tracking-tight text-slate-900">{value}</div>
      {hint ? <div className="mt-1 text-[15px] font-medium text-slate-600">{hint}</div> : null}
    </div>
  );
}

/* ---------- States ---------- */

export function EmptyState({ icon, title, body, action, className }: { icon?: ReactNode; title: string; body?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={clsx("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      {icon ? <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-700">{icon}</div> : null}
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      {body ? <div className="mt-2 max-w-md text-slate-600">{body}</div> : null}
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
    <div role="alert" className={clsx("rounded-2xl border-2 border-rose-600 bg-rose-50 p-6", className)}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-rose-700" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-rose-950">{title}</h2>
          <p className="mt-1 text-rose-900">{message}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {onRetry ? (
              <Button variant="secondary" size="sm" onClick={onRetry} loading={retrying} icon={<RotateCw className="h-4 w-4" aria-hidden />}>
                Try again
              </Button>
            ) : null}
            {details ? (
              <button type="button" onClick={() => setOpen((v) => !v)} className={clsx("text-[15px] font-semibold text-rose-900 underline underline-offset-2", focusRing)} aria-expanded={open}>
                {open ? "Hide details" : "Show details"}
              </button>
            ) : null}
          </div>
          {open && details ? (
            <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-3 font-mono text-[13px] text-slate-800">{details}</pre>
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
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition-colors duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-60",
        focusRing,
        checked ? "border-emerald-600 bg-emerald-600" : "border-slate-300 bg-slate-200"
      )}
    >
      <span
        aria-hidden
        className={clsx(
          "inline-block h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ease-out motion-reduce:transition-none",
          checked ? "translate-x-6" : "translate-x-0.5"
        )}
      />
    </button>
  );
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
    <div role="radiogroup" aria-label={label} className={clsx("inline-flex rounded-xl border-2 border-slate-200 bg-slate-100 p-1", className)}>
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(s.value)}
            className={clsx(
              "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[15px] font-semibold transition-colors duration-150",
              focusRing,
              active ? "bg-white text-slate-900 shadow-sm" : "text-slate-700 hover:text-slate-900"
            )}
          >
            {s.label}
            {typeof s.count === "number" ? (
              <span className={clsx("rounded-md px-1.5 text-[13px] tabular-nums", active ? s.className ?? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700")}>
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
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="w-[min(92vw,32rem)] rounded-2xl border-2 border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl font-bold">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className={clsx("rounded-lg p-1 text-slate-600 hover:bg-slate-100", focusRing)}>
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="mt-3 text-slate-700">{children}</div>
      </div>
      {footer ? <div className="flex justify-end gap-2 border-t-2 border-slate-100 bg-slate-50 px-6 py-4">{footer}</div> : null}
    </dialog>
  );
}
