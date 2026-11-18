import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/format'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'light'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const variants: Record<Variant, string> = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm',
  secondary: 'bg-navy-900 text-white hover:bg-navy-800',
  outline: 'border border-line bg-white text-ink hover:border-brand-200 hover:bg-brand-50',
  ghost: 'text-ink hover:bg-brand-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  light: 'bg-white text-navy-900 hover:bg-brand-50',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  icon: 'h-10 w-10',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  block?: boolean
}

export const buttonClass = (variant: Variant = 'primary', size: Size = 'md', block = false) =>
  cn(
    'inline-flex shrink-0 items-center justify-center rounded-xl font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    block && 'w-full',
  )

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', block, className, type = 'button', ...props },
  ref,
) {
  return <button ref={ref} type={type} className={cn(buttonClass(variant, size, block), className)} {...props} />
})
