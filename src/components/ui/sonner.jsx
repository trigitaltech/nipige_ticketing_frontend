import { Toaster as Sonner } from "sonner";
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }) => (
  <Sonner
    theme="light"
    className="toaster group"
    icons={{
      success: <CircleCheckIcon className="size-4" />,
      info: <InfoIcon className="size-4" />,
      warning: <TriangleAlertIcon className="size-4" />,
      error: <OctagonXIcon className="size-4" />,
      loading: <Loader2Icon className="size-4 animate-spin" />,
    }}
    style={{
      "--border-radius": "0.5rem",
      "--normal-bg": "#ffffff",
      "--normal-border": "#e2e8f0",
      "--normal-text": "#0f172a",
      "--success-bg": "#f0fdf4",
      "--success-border": "#bbf7d0",
      "--success-text": "#15803d",
      "--error-bg": "#fff1f2",
      "--error-border": "#fecdd3",
      "--error-text": "#be123c",
      "--warning-bg": "#fffbeb",
      "--warning-border": "#fde68a",
      "--warning-text": "#b45309",
    }}
    toastOptions={{
      style: { fontFamily: "inherit", fontSize: "13px" },
    }}
    {...props}
  />
)

export { Toaster }
