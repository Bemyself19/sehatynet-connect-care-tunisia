import React, { useRef, useState, useEffect } from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const ScrollButton = ({ direction, onClick, disabled }: { direction: 'left' | 'right', onClick: () => void, disabled: boolean }) => (
  <button
    type="button"
    aria-label={direction === 'left' ? 'Scroll left' : 'Scroll right'}
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'absolute top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-white shadow border border-gray-200 hover:bg-gray-100 transition',
      direction === 'left' ? 'left-0' : 'right-0',
      'disabled:opacity-40 disabled:cursor-not-allowed hidden md:block'
    )}
    style={{ pointerEvents: disabled ? 'none' : 'auto' }}
  >
    {direction === 'left' ? <span>&#8592;</span> : <span>&#8594;</span>}
  </button>
)

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setShowLeft(el.scrollLeft > 0)
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [])

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.7
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <div className="relative w-full">
      <ScrollButton direction="left" onClick={() => scroll('left')} disabled={!showLeft} />
      <div
        ref={scrollRef}
        className={cn(
          "flex flex-row flex-wrap items-start bg-muted p-1 text-muted-foreground scrollbar-thin scrollbar-thumb-rounded-md scrollbar-thumb-gray-300 max-w-full gap-1 rounded-md min-h-[60px]",
          className
        )}
        style={{ WebkitOverflowScrolling: 'touch', overflowX: 'visible', overflowY: 'visible' }}
      >
      <TabsPrimitive.List ref={ref} className="flex flex-row flex-wrap w-full min-h-[60px]" {...props} />
      </div>
      <ScrollButton direction="right" onClick={() => scroll('right')} disabled={!showRight} />
    </div>
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex flex-col items-center justify-center break-words whitespace-normal rounded-sm px-5 py-3 text-base font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm min-w-[140px] min-h-[60px] w-full",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
