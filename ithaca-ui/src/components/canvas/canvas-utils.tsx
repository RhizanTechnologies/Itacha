"use client";

import { Lightbulb, X } from "lucide-react";
import { drawDiscNodeLabel } from "sigma/rendering";

// =============================================================================
// TOAST NOTIFICATION
// =============================================================================

interface NewArgumentToastProps {
  show: boolean;
  message: string;
  onClose: () => void;
}

/**
 * Toast notification for new argument discoveries.
 */
export function NewArgumentToast({
  show,
  message,
  onClose,
}: NewArgumentToastProps) {
  if (!show) return null;

  return (
    <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="bg-card/95 border-primary/30 flex items-center gap-3 rounded-lg border p-1 pr-4 shadow-[0_0_20px_rgba(59,130,246,0.2)] backdrop-blur-sm">
        <div className="bg-primary/20 text-primary flex items-center justify-center rounded p-2">
          <Lightbulb className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-foreground text-sm font-bold">
            New Argument Found
          </span>
          <span className="text-muted-foreground text-xs">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground ml-4 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// THEME-AWARE NODE HOVER DRAWER
// =============================================================================

/**
 * Custom hover drawer that uses theme-aware colors.
 * Based on Sigma's drawDiscNodeHover but with configurable background colors.
 */
export function createThemeAwareHoverDrawer(isDark: boolean) {
  return function drawNodeHover(
    context: CanvasRenderingContext2D,
    data: {
      x: number;
      y: number;
      size: number;
      label?: string | null;
      color?: string;
      [key: string]: unknown;
    },
    settings: {
      labelSize: number;
      labelFont: string;
      labelWeight: string;
      labelColor: { color?: string; attribute?: string };
    },
  ) {
    const size = settings.labelSize;
    const font = settings.labelFont;
    const weight = settings.labelWeight;

    context.font = `${weight} ${size}px ${font}`;

    // Theme-aware colors
    const bgColor = isDark ? "#1f2937" : "#ffffff";
    const shadowColor = isDark ? "rgba(0,0,0,0.5)" : "#000";

    // Draw the label background with theme-aware colors
    context.fillStyle = bgColor;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 8;
    context.shadowColor = shadowColor;

    const PADDING = 2;

    if (typeof data.label === "string") {
      const textWidth = context.measureText(data.label).width;
      const boxWidth = Math.round(textWidth + 5);
      const boxHeight = Math.round(size + 2 * PADDING);
      const radius = Math.max(data.size, size / 2) + PADDING;

      const angleRadian = Math.asin(boxHeight / 2 / radius);
      const xDeltaCoord = Math.sqrt(
        Math.abs(Math.pow(radius, 2) - Math.pow(boxHeight / 2, 2)),
      );

      context.beginPath();
      context.moveTo(data.x + xDeltaCoord, data.y + boxHeight / 2);
      context.lineTo(data.x + radius + boxWidth, data.y + boxHeight / 2);
      context.lineTo(data.x + radius + boxWidth, data.y - boxHeight / 2);
      context.lineTo(data.x + xDeltaCoord, data.y - boxHeight / 2);
      context.arc(data.x, data.y, radius, angleRadian, -angleRadian);
      context.closePath();
      context.fill();
    } else {
      context.beginPath();
      context.arc(data.x, data.y, data.size + PADDING, 0, Math.PI * 2);
      context.closePath();
      context.fill();
    }

    // Reset shadow
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 0;

    // Draw the label with Sigma's default label drawer
    drawDiscNodeLabel(
      context,
      data as Parameters<typeof drawDiscNodeLabel>[1],
      settings as Parameters<typeof drawDiscNodeLabel>[2],
    );
  };
}
