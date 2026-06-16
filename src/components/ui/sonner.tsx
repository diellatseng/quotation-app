import {
  CircleCheck,
  Info,
  Loader2,
  OctagonX,
  TriangleAlert,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

import { useAppearance } from "@/context/AppearanceContext"

const Toaster = ({ ...props }: ToasterProps) => {
  const appearance = useAppearance()
  const theme = appearance?.theme === "dark" ? "dark" : "light"

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      position="top-right"
      closeButton
      duration={4000}
      icons={{
        success: <CircleCheck className="size-4 shrink-0" aria-hidden="true" />,
        info: <Info className="size-4 shrink-0" aria-hidden="true" />,
        warning: <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />,
        error: <OctagonX className="size-4 shrink-0" aria-hidden="true" />,
        loading: (
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "font-sans",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
