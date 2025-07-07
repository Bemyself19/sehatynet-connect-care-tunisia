import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { useTranslation } from 'react-i18next';
import enUS from 'date-fns/locale/en-US';
import fr from 'date-fns/locale/fr';
import ar from 'date-fns/locale/ar-SA';
import { Locale } from 'date-fns';

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// Fully custom Tunisian Arabic (ar-TN) locale for date-fns
const arTN: Locale = {
  code: 'ar-TN',
  formatDistance: () => '',
  formatLong: {
    date: () => 'yyyy/MM/dd',
    time: () => 'HH:mm',
    dateTime: () => 'yyyy/MM/dd HH:mm',
  },
  formatRelative: () => '',
  localize: {
    ordinalNumber: (n: number) => String(n),
    era: () => '',
    quarter: () => '',
    month: (n: number, _opts?: any) => [
      'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
      'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ][n],
    day: (n: number, _opts?: any) => [
      'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
    ][n],
    dayPeriod: () => '',
  },
  match: {
    ordinalNumber: () => null,
    era: () => null,
    quarter: () => null,
    month: () => null,
    day: () => null,
    dayPeriod: () => null,
  },
  options: {
    weekStartsOn: 1, // Monday
    firstWeekContainsDate: 1,
  },
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  modifiers,
  modifiersClassNames,
  ...props
}: CalendarProps) {
  const { i18n } = useTranslation();
  let locale = enUS;
  if (i18n.language === 'fr') locale = fr;
  if (i18n.language === 'ar') locale = arTN;
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
    <div dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <DayPicker
        showOutsideDays={showOutsideDays}
        modifiers={mergedModifiers}
        modifiersClassNames={mergedModifiersClassNames}
        weekStartsOn={i18n.language === 'ar' ? 1 : 1}
        locale={locale}
        {...props}
        classNames={{
          ...classNames,
          head_row: i18n.language === 'ar' ? 'rdp-head_row text-right' : 'rdp-head_row',
          caption_label: i18n.language === 'ar' ? 'rdp-caption_label text-right' : 'rdp-caption_label',
        }}
      />
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
