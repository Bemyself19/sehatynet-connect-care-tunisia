import { LocationData } from './index';

export const southAmericaData: LocationData = {
  countries: [
    {
      code: "BR",
      name: {
        en: "Brazil",
        fr: "Brésil",
        ar: "البرازيل"
      },
      provinces: [
        {
          code: "BR-SP",
          name: {
            en: "São Paulo",
            fr: "São Paulo",
            ar: "ساو باولو"
          },
          cities: [
            {
              code: "BR-SP-SAO",
              name: {
                en: "São Paulo",
                fr: "São Paulo",
                ar: "ساو باولو"
              }
            },
            {
              code: "BR-SP-CAM",
              name: {
                en: "Campinas",
                fr: "Campinas",
                ar: "كامبيناس"
              }
            }
          ]
        },
        {
          code: "BR-RJ",
          name: {
            en: "Rio de Janeiro",
            fr: "Rio de Janeiro",
            ar: "ريو دي جانيرو"
          },
          cities: [
            {
              code: "BR-RJ-RIO",
              name: {
                en: "Rio de Janeiro",
                fr: "Rio de Janeiro",
                ar: "ريو دي جانيرو"
              }
            },
            {
              code: "BR-RJ-NIT",
              name: {
                en: "Niterói",
                fr: "Niterói",
                ar: "نيتيروي"
              }
            }
          ]
        }
      ]
    },
    {
      code: "AR",
      name: {
        en: "Argentina",
        fr: "Argentine",
        ar: "الأرجنتين"
      },
      provinces: [
        {
          code: "AR-B",
          name: {
            en: "Buenos Aires",
            fr: "Buenos Aires",
            ar: "بوينس آيرس"
          },
          cities: [
            {
              code: "AR-B-BUE",
              name: {
                en: "Buenos Aires",
                fr: "Buenos Aires",
                ar: "بوينس آيرس"
              }
            }
          ]
        },
        {
          code: "AR-C",
          name: {
            en: "Córdoba",
            fr: "Córdoba",
            ar: "قرطبة"
          },
          cities: [
            {
              code: "AR-C-COR",
              name: {
                en: "Córdoba",
                fr: "Córdoba",
                ar: "قرطبة"
              }
            }
          ]
        }
      ]
    },
    {
      code: "CO",
      name: {
        en: "Colombia",
        fr: "Colombie",
        ar: "كولومبيا"
      },
      provinces: [
        {
          code: "CO-DC",
          name: {
            en: "Bogotá",
            fr: "Bogota",
            ar: "بوغوتا"
          },
          cities: [
            {
              code: "CO-DC-BOG",
              name: {
                en: "Bogotá",
                fr: "Bogota",
                ar: "بوغوتا"
              }
            }
          ]
        },
        {
          code: "CO-ANT",
          name: {
            en: "Antioquia",
            fr: "Antioquia",
            ar: "أنتيوكيا"
          },
          cities: [
            {
              code: "CO-ANT-MDE",
              name: {
                en: "Medellín",
                fr: "Medellín",
                ar: "ميديلين"
              }
            }
          ]
        }
      ]
    }
  ]
};
