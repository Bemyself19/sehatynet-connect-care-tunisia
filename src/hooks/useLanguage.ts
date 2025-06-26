import { useState, useEffect } from 'react';

type Language = 'en' | 'fr' | 'ar';

interface Translations {
  [key: string]: {
    en: string;
    fr: string;
    ar: string;
  };
}

const translations: Translations = {
  login: {
    en: 'Login',
    fr: 'Connexion',
    ar: 'تسجيل الدخول'
  },
  register: {
    en: 'Register',
    fr: "S'inscrire",
    ar: 'تسجيل'
  },
  heroTitle: {
    en: 'Healthcare at Your Fingertips',
    fr: 'Soins de santé à portée de main',
    ar: 'الرعاية الصحية في متناول يدك'
  },
  heroSubtitle: {
    en: 'Connect with doctors, pharmacies, labs, and radiologists across Tunisia and beyond. Secure, multilingual telehealth platform.',
    fr: 'Connectez-vous avec des médecins, pharmacies, laboratoires et radiologues en Tunisie et au-delà. Plateforme de télésanté sécurisée et multilingue.',
    ar: 'تواصل مع الأطباء والصيدليات والمختبرات وأخصائيي الأشعة في تونس وخارجها. منصة طبية آمنة ومتعددة اللغات.'
  },
  registerAsPatient: {
    en: 'Register as Patient',
    fr: 'Inscription Patient',
    ar: 'تسجيل كمريض'
  },
  registerAsProvider: {
    en: 'Register as Provider',
    fr: 'Inscription Prestataire',
    ar: 'تسجيل كمقدم خدمة'
  },
  secureTitle: {
    en: 'Secure & Private',
    fr: 'Sécurisé et Privé',
    ar: 'آمن وخاص'
  },
  secureDescription: {
    en: 'End-to-end encryption and GDPR compliance for your medical data.',
    fr: 'Chiffrement de bout en bout et conformité RGPD pour vos données médicales.',
    ar: 'تشفير شامل وامتثال لقوانين حماية البيانات الطبية.'
  },
  availableTitle: {
    en: '24/7 Available',
    fr: 'Disponible 24h/24',
    ar: 'متاح على مدار الساعة'
  },
  availableDescription: {
    en: 'Access healthcare services anytime, anywhere with our telehealth platform.',
    fr: 'Accédez aux services de santé à tout moment, partout avec notre plateforme de télésanté.',
    ar: 'الوصول إلى الخدمات الصحية في أي وقت ومن أي مكان عبر منصتنا الطبية.'
  },
  comprehensiveTitle: {
    en: 'Comprehensive Care',
    fr: 'Soins Complets',
    ar: 'رعاية شاملة'
  },
  comprehensiveDescription: {
    en: 'Complete healthcare ecosystem with doctors, pharmacies, labs, and imaging centers.',
    fr: 'Écosystème de santé complet avec médecins, pharmacies, laboratoires et centres d\'imagerie.',
    ar: 'نظام رعاية صحية متكامل مع الأطباء والصيدليات والمختبرات ومراكز التصوير.'
  },
  patientDashboard: {
    en: 'Patient Dashboard',
    fr: 'Tableau de Bord Patient',
    ar: 'لوحة تحكم المريض'
  },
  dashboardSubtitle: {
    en: 'Manage your health journey',
    fr: 'Gérez votre parcours de santé',
    ar: 'إدارة رحلتك الصحية'
  },
  bookAppointment: {
    en: 'Book Appointment',
    fr: 'Prendre Rendez-vous',
    ar: 'حجز موعد'
  },
  scheduleConsultation: {
    en: 'Schedule a new consultation',
    fr: 'Planifier une nouvelle consultation',
    ar: 'جدولة استشارة جديدة'
  },
  appointments: {
    en: 'Appointments',
    fr: 'Rendez-vous',
    ar: 'المواعيد'
  },
  viewAppointments: {
    en: 'View upcoming appointments',
    fr: 'Voir les rendez-vous à venir',
    ar: 'عرض المواعيد القادمة'
  },
  medicalRecords: {
    en: 'Medical Records',
    fr: 'Dossiers Médicaux',
    ar: 'السجلات الطبية'
  },
  accessRecords: {
    en: 'Access your health records',
    fr: 'Accédez à vos dossiers de santé',
    ar: 'الوصول إلى سجلاتك الصحية'
  },
  teleExpertise: {
    en: 'Tele-Expertise',
    fr: 'Télé-Expertise',
    ar: 'الاستشارة عن بعد'
  },
  requestSecondOpinion: {
    en: 'Request a second opinion',
    fr: 'Demander un deuxième avis',
    ar: 'طلب رأي ثان'
  },
  profile: {
    en: 'Profile',
    fr: 'Profil',
    ar: 'الملف الشخصي'
  },
  updateProfile: {
    en: 'Update your profile',
    fr: 'Mettre à jour votre profil',
    ar: 'تحديث ملفك الشخصي'
  },
  welcome: {
    en: 'Welcome',
    fr: 'Bienvenue',
    ar: 'أهلاً بك'
  },
  logout: {
    en: 'Logout',
    fr: 'Déconnexion',
    ar: 'تسجيل الخروج'
  }
};

export const useLanguage = () => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('sehatynet-language') as Language;
    if (savedLang && ['en', 'fr', 'ar'].includes(savedLang)) {
      setCurrentLanguage(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('sehatynet-language', lang);
    
    // Set document direction for RTL support
    document.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (key: string): string => {
    return translations[key]?.[currentLanguage] || key;
  };

  return {
    currentLanguage,
    setLanguage,
    t
  };
};
