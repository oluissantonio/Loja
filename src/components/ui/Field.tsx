import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/format'

const control =
  'w-full rounded-xl border border-line bg-white px-3.5 text-[15px] text-ink placeholder:text-ink-faint transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:bg-slate-50'

interface WrapProps { label: string; hint?: ReactNode; error?: string; children: (id: string) => ReactNode; className?: string }

function Wrap({ label, hint, error, children, className }: WrapProps) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      {children(id)}
      {error ? <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : hint ? <p className="mt-1.5 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  )
}

type Common = { label: string; hint?: ReactNode; error?: string; wrapClassName?: string }

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & Common>(function Input(
  { label, hint, error, wrapClassName, className, ...props },
  ref,
) {
  return (
    <Wrap label={label} hint={hint} error={error} className={wrapClassName}>
      {(id) => <input ref={ref} id={id} aria-invalid={!!error} className={cn(control, 'h-11', error && 'border-red-500', className)} {...props} />}
    </Wrap>
  )
})

export function Select({ label, hint, error, wrapClassName, className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & Common) {
  return (
    <Wrap label={label} hint={hint} error={error} className={wrapClassName}>
      {(id) => (
        <select id={id} className={cn(control, 'h-11 appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%2020%2020%27%20fill%3D%27%235A6785%27%3E%3Cpath%20d%3D%27M5.3%207.3a1%201%200%20011.4%200L10%2010.6l3.3-3.3a1%201%200%20111.4%201.4l-4%204a1%201%200%2001-1.4%200l-4-4a1%201%200%20010-1.4z%27/%3E%3C/svg%3E")] bg-[length:18px] bg-[right_12px_center] bg-no-repeat pr-10', className)} {...props}>
          {children}
        </select>
      )}
    </Wrap>
  )
}

export function Textarea({ label, hint, error, wrapClassName, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & Common) {
  return (
    <Wrap label={label} hint={hint} error={error} className={wrapClassName}>
      {(id) => <textarea id={id} aria-invalid={!!error} className={cn(control, 'min-h-[96px] py-3', error && 'border-red-500', className)} {...props} />}
    </Wrap>
  )
}
