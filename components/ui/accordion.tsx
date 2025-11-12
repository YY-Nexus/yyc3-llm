import * as React from "react"
import { cn } from "@/lib/utils"

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-2", className)} {...props}>
    {children}
  </div>
))
Accordion.displayName = "Accordion"

interface AccordionItemProps extends React.DetailsHTMLAttributes<HTMLDetailsElement> {}

const AccordionItem = React.forwardRef<HTMLDetailsElement, AccordionItemProps>(({ className, children, ...props }, ref) => (
  <details ref={ref} className={cn("group rounded-md border", className)} {...props}>
    {children}
  </details>
))
AccordionItem.displayName = "AccordionItem"

interface AccordionTriggerProps extends React.HTMLAttributes<HTMLElement> {}

const AccordionTrigger = React.forwardRef<HTMLElement, AccordionTriggerProps>(({ className, children, ...props }, ref) => (
  <summary ref={ref as any} className={cn("cursor-pointer list-none px-4 py-2 font-medium [&::-webkit-details-marker]:hidden", className)} {...props}>
    {children}
  </summary>
))
AccordionTrigger.displayName = "AccordionTrigger"

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("px-4 py-2 text-sm text-muted-foreground", className)} {...props}>
    {children}
  </div>
))
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }