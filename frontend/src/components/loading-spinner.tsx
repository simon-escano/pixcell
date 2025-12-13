import { cn } from "@/utils"

interface LoadingSpinnerProps {
  className?: string
  text?: string
}

export function LoadingSpinner({ className, text }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative">
        <div className="h-5 w-5 rounded-full border-2 border-muted" />
        <div className="absolute inset-0 h-5 w-5 rounded-full border-2 border-transparent border-t-primary animate-spin" />
      </div>
      {text && <p className="text-sm text-muted-foreground animate-pulse">{text}</p>}
    </div>
  )
}

