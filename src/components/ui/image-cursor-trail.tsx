"use client"
import React, { createRef, useRef, type ReactNode, useEffect } from "react"

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
}

interface ImageMouseTrailProps {
  items: string[]
  children?: ReactNode
  className?: string
  imgClass?: string
  distance?: number
  maxNumberOfImages?: number
  fadeAnimation?: boolean
}

function ImageCursorTrail({
  items,
  children,
  className,
  maxNumberOfImages = 5,
  imgClass = "w-40 h-48",
  distance = 20,
  fadeAnimation = false,
}: ImageMouseTrailProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const refs = useRef(items.map(() => createRef<HTMLImageElement>()))
  const currentZIndexRef = useRef(1)
  const globalIndexRef = useRef(0)
  const lastRef = useRef({ x: 0, y: 0 })

  const activate = (image: HTMLImageElement, x: number, y: number) => {
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return

    const relativeX = x - containerRect.left
    const relativeY = y - containerRect.top

    image.style.left = `${relativeX}px`
    image.style.top = `${relativeY}px`

    if (currentZIndexRef.current > 100) {
      currentZIndexRef.current = 1
    }
    image.style.zIndex = String(currentZIndexRef.current)
    currentZIndexRef.current++

    image.dataset.status = "active"

    if (fadeAnimation) {
      setTimeout(() => {
        image.dataset.status = "inactive"
      }, 1500)
    }

    lastRef.current = { x, y }
  }

  const distanceFromLast = (x: number, y: number) =>
    Math.hypot(x - lastRef.current.x, y - lastRef.current.y)

  const deactivate = (image: HTMLImageElement) => {
    image.dataset.status = "inactive"
  }

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      let x = 0
      let y = 0
      
      if (e instanceof MouseEvent) {
        x = e.clientX
        y = e.clientY
      } else if (e instanceof TouchEvent && e.touches.length > 0) {
        x = e.touches[0].clientX
        y = e.touches[0].clientY
      } else {
        return
      }

      if (!containerRef.current) return
      
      const rect = containerRef.current.getBoundingClientRect()
      const isInside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
      
      if (isInside) {
        // console.log("Inside container, distance from last:", distanceFromLast(x, y));
      }

      if (isInside && distanceFromLast(x, y) > distance) {
        const lead = refs.current[globalIndexRef.current % refs.current.length].current
        const tail =
          refs.current[(globalIndexRef.current - maxNumberOfImages) % refs.current.length]
            ?.current

        if (lead) activate(lead, x, y)
        if (tail) deactivate(tail)

        globalIndexRef.current++
      }
    }

    window.addEventListener('mousemove', handleMove as EventListener)
    window.addEventListener('touchmove', handleMove as EventListener)

    return () => {
      window.removeEventListener('mousemove', handleMove as EventListener)
      window.removeEventListener('touchmove', handleMove as EventListener)
    }
  }, [distance, maxNumberOfImages, fadeAnimation])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden pointer-events-none",
        className
      )}
    >
      {items.map((item, index) => (
        <img
          key={index}
          className={cn(
            "pointer-events-none opacity-0 absolute -translate-x-[50%] -translate-y-[50%] scale-0 rounded-2xl object-cover transition-all duration-300 data-[status='active']:scale-100 data-[status='active']:opacity-100 data-[status='active']:duration-500 shadow-xl border-2 border-white",
            imgClass
          )}
          data-index={index}
          data-status="inactive"
          src={item}
          alt={`image-${index}`}
          ref={refs.current[index]}
        />
      ))}
      {children}
    </div>
  )
}

export { ImageCursorTrail }
