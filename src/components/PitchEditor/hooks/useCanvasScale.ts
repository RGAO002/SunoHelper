import { useEffect, useState, type RefObject } from 'react'

interface CanvasDimensions {
  width: number
  height: number
  dpr: number
}

export function useCanvasScale(
  containerRef: RefObject<HTMLDivElement | null>,
): CanvasDimensions {
  const [dims, setDims] = useState<CanvasDimensions>({
    width: 0,
    height: 0,
    dpr: 1,
  })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      const dpr = window.devicePixelRatio || 1
      setDims({ width, height, dpr })
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [containerRef])

  return dims
}

/** Apply DPI scaling to a canvas element */
export function applyCanvasScale(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  dpr: number,
): CanvasRenderingContext2D {
  canvas.width = width * dpr
  canvas.height = height * dpr
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)
  return ctx
}
