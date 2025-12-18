import { LoadingSpinner } from "@/components/loading-spinner"

interface LoadingScreenProps {
  text?: string
}

export function LoadingScreen({ text = "Loading..." }: LoadingScreenProps) {
  return (
    <div className="flex min-h-full w-full items-center justify-center py-12">
      <LoadingSpinner text={text} />
    </div>
  )
}

