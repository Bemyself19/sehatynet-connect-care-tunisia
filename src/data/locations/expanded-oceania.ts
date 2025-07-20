import { LocationData } from './index';

export const oceaniaData: LocationData = {
  countries: [
    {
      code: "AU",
      name: {
        en: "Australia",
        fr: "Australie",
        ar: "أستراليا"
      },
      provinces: [
        {
          code: "AU-NSW",
          name: {
            en: "New South Wales",
            fr: "Nouvelle-Galles du Sud",
            ar: "نيو ساوث ويلز"
          },
          cities: [
            {
              code: "AU-NSW-SYD",
              name: {
                en: "Sydney",
                fr: "Sydney",
                ar: "سيدني"
              }
            },
            {
              code: "AU-NSW-NEW",
              name: {
                en: "Newcastle",
                fr: "Newcastle",
                ar: "نيوكاسل"
              }
            }
          ]
        },
        {
          code: "AU-VIC",
          name: {
            en: "Victoria",
            fr: "Victoria",
            ar: "فيكتوريا"
          },
          cities: [
            {
              code: "AU-VIC-MEL",
              name: {
                en: "Melbourne",
                fr: "Melbourne",
                ar: "ملبورن"
              }
            },
            {
              code: "AU-VIC-GEE",
              name: {
                en: "Geelong",
                fr: "Geelong",
                ar: "جيلونج"
              }
            }
          ]
        },
        {
          code: "AU-QLD",
          name: {
            en: "Queensland",
            fr: "Queensland",
            ar: "كوينزلاند"
          },
          cities: [
            {
              code: "AU-QLD-BRI",
              name: {
                en: "Brisbane",
                fr: "Brisbane",
                ar: "برسبان"
              }
            },
            {
              code: "AU-QLD-GCO",
              name: {
                en: "Gold Coast",
                fr: "Gold Coast",
                ar: "جولد كوست"
              }
            }
          ]
        }
      ]
    },
    {
      code: "NZ",
      name: {
        en: "New Zealand",
        fr: "Nouvelle-Zélande",
        ar: "نيوزيلندا"
      },
      provinces: [
        {
          code: "NZ-AUK",
          name: {
            en: "Auckland",
            fr: "Auckland",
            ar: "أوكلاند"
          },
          cities: [
            {
              code: "NZ-AUK-AUK",
              name: {
                en: "Auckland",
                fr: "Auckland",
                ar: "أوكلاند"
              }
            }
          ]
        },
        {
          code: "NZ-WGN",
          name: {
            en: "Wellington",
            fr: "Wellington",
            ar: "ويلينغتون"
          },
          cities: [
            {
              code: "NZ-WGN-WGN",
              name: {
                en: "Wellington",
                fr: "Wellington",
                ar: "ويلينغتون"
              }
            }
          ]
        },
        {
          code: "NZ-CAN",
          name: {
            en: "Canterbury",
            fr: "Canterbury",
            ar: "كانتربيري"
          },
          cities: [
            {
              code: "NZ-CAN-CHC",
              name: {
                en: "Christchurch",
                fr: "Christchurch",
                ar: "كرايستشيرش"
              }
            }
          ]
        }
      ]
    }
  ]
};
