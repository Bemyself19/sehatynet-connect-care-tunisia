import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  modifiers,
  modifiersClassNames,
  ...props
}: CalendarProps) {
  // Calculate today and disable past dates
  const today = new Date();
  // Ensure disabled is always an array of matchers
  const disabledMatchers = [
    (date: Date) => {
      const now = new Date();
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return d < t;
    },
    ...(Array.isArray(modifiers?.disabled) ? modifiers.disabled : modifiers?.disabled ? [modifiers.disabled] : [])
  ];
  const mergedModifiers = {
    ...modifiers,
    today: [(date: Date) => date.toDateString() === today.toDateString()],
    disabled: disabledMatchers,
  };
  const mergedModifiersClassNames = {
    ...modifiersClassNames,
    available: 'rdp-day_available',
    today: 'rdp-day_today',
    disabled: 'rdp-day_disabled',
  };
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      modifiers={mergedModifiers}
      modifiersClassNames={mergedModifiersClassNames}
      weekStartsOn={1}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
