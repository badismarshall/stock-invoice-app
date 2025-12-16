"use client"

import { cn } from "@/lib/utils"
import * as React from "react"

interface CropperProps extends React.HTMLAttributes<HTMLDivElement> {
  image?: string
  zoom?: number
  onCropChange?: (pixels: { x: number; y: number; width: number; height: number } | null) => void
  onZoomChange?: (zoom: number) => void
}

function Cropper({
  className,
  image,
  zoom = 1,
  onCropChange,
  onZoomChange,
  children,
  ...props
}: CropperProps) {
  return (
    <div
      data-slot="cropper"
      className={cn(
        "relative flex w-full cursor-move touch-none items-center justify-center overflow-hidden focus:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function CropperDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="cropper-description"
      className={cn("sr-only", className)}
      {...props}
    />
  )
}

function CropperImage({
  className,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      data-slot="cropper-image"
      className={cn(
        "pointer-events-none h-full w-full object-cover",
        className
      )}
      {...props}
    />
  )
}

function CropperCropArea({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="cropper-crop-area"
      className={cn(
        "pointer-events-none absolute border-3 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.3)] in-[[data-slot=cropper]:focus-visible]:ring-[3px] in-[[data-slot=cropper]:focus-visible]:ring-white/50",
        className
      )}
      {...props}
    />
  )
}

export { Cropper, CropperDescription, CropperImage, CropperCropArea }
