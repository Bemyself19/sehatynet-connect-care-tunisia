// Custom date-fns locale for Tunisian Arabic (ar-TN)
// Month names: جانفي، فيفري، مارس، أفريل، ماي، جوان، جويلية، أوت، سبتمبر، أكتوبر، نوفمبر، ديسمبر
// Day names: الأحد، الاثنين، الثلاثاء، الأربعاء، الخميس، الجمعة، السبت
import { Locale } from 'date-fns';
import arSA from 'date-fns/locale/ar-SA';

const monthValues = {
  narrow: ['ج', 'ف', 'م', 'أ', 'م', 'ج', 'ج', 'أ', 'س', 'أ', 'ن', 'د'],
  abbreviated: ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  wide: ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
};

const dayValues = {
  narrow: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'],
  short: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
  abbreviated: ['أحد', 'اثنـ', 'ثلا', 'أربـ', 'خميـ', 'جمعة', 'سبت'],
  wide: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
};

const localize = {
  ...arSA.localize,
  month: (n: number, opts?: any) => {
    const width = opts?.width || 'wide';
    return monthValues[width][n];
  },
  day: (n: number, opts?: any) => {
    const width = opts?.width || 'wide';
    return dayValues[width][n];
  }
};

const arTN: Locale = {
  ...arSA,
  code: 'ar-TN',
  localize: localize as any,
};

export default arTN;
