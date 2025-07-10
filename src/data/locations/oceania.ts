import { LocationData, Country, Province, City } from './index';

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
          code: "NSW",
          name: {
            en: "New South Wales",
            fr: "Nouvelle-Galles du Sud",
            ar: "نيو ساوث ويلز"
          },
          cities: [
            {
              code: "SYD",
              name: {
                en: "Sydney",
                fr: "Sydney",
                ar: "سيدني"
              }
            },
            {
              code: "NEW",
              name: {
                en: "Newcastle",
                fr: "Newcastle",
                ar: "نيوكاسل"
              }
            },
            {
              code: "WOL",
              name: {
                en: "Wollongong",
                fr: "Wollongong",
                ar: "ولونغونغ"
              }
            }
          ]
        },
        {
          code: "VIC",
          name: {
            en: "Victoria",
            fr: "Victoria",
            ar: "فيكتوريا"
          },
          cities: [
            {
              code: "MEL",
              name: {
                en: "Melbourne",
                fr: "Melbourne",
                ar: "ملبورن"
              }
            },
            {
              code: "GEE",
              name: {
                en: "Geelong",
                fr: "Geelong",
                ar: "جيلونج"
              }
            },
            {
              code: "BAL",
              name: {
                en: "Ballarat",
                fr: "Ballarat",
                ar: "بالارات"
              }
            }
          ]
        },
        {
          code: "QLD",
          name: {
            en: "Queensland",
            fr: "Queensland",
            ar: "كوينزلاند"
          },
          cities: [
            {
              code: "BNE",
              name: {
                en: "Brisbane",
                fr: "Brisbane",
                ar: "بريسبان"
              }
            },
            {
              code: "GCO",
              name: {
                en: "Gold Coast",
                fr: "Gold Coast",
                ar: "جولد كوست"
              }
            },
            {
              code: "CNS",
              name: {
                en: "Cairns",
                fr: "Cairns",
                ar: "كيرنز"
              }
            }
          ]
        },
        {
          code: "WA",
          name: {
            en: "Western Australia",
            fr: "Australie-Occidentale",
            ar: "أستراليا الغربية"
          },
          cities: [
            {
              code: "PER",
              name: {
                en: "Perth",
                fr: "Perth",
                ar: "بيرث"
              }
            },
            {
              code: "FRE",
              name: {
                en: "Fremantle",
                fr: "Fremantle",
                ar: "فريمانتل"
              }
            }
          ]
        },
        {
          code: "SA",
          name: {
            en: "South Australia",
            fr: "Australie-Méridionale",
            ar: "أستراليا الجنوبية"
          },
          cities: [
            {
              code: "ADL",
              name: {
                en: "Adelaide",
                fr: "Adélaïde",
                ar: "أديلايد"
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
          code: "AUK",
          name: {
            en: "Auckland",
            fr: "Auckland",
            ar: "أوكلاند"
          },
          cities: [
            {
              code: "AKL",
              name: {
                en: "Auckland",
                fr: "Auckland",
                ar: "أوكلاند"
              }
            }
          ]
        },
        {
          code: "WGN",
          name: {
            en: "Wellington",
            fr: "Wellington",
            ar: "ولينغتون"
          },
          cities: [
            {
              code: "WLG",
              name: {
                en: "Wellington",
                fr: "Wellington",
                ar: "ولينغتون"
              }
            }
          ]
        },
        {
          code: "CAN",
          name: {
            en: "Canterbury",
            fr: "Canterbury",
            ar: "كانتربري"
          },
          cities: [
            {
              code: "CHC",
              name: {
                en: "Christchurch",
                fr: "Christchurch",
                ar: "كرايستشيرش"
              }
            }
          ]
        }
      ]
    },
    {
      code: "FJ",
      name: {
        en: "Fiji",
        fr: "Fidji",
        ar: "فيجي"
      },
      provinces: [
        {
          code: "C",
          name: {
            en: "Central Division",
            fr: "Division Centrale",
            ar: "المنطقة الوسطى"
          },
          cities: [
            {
              code: "SUV",
              name: {
                en: "Suva",
                fr: "Suva",
                ar: "سوفا"
              }
            }
          ]
        },
        {
          code: "W",
          name: {
            en: "Western Division",
            fr: "Division Occidentale",
            ar: "المنطقة الغربية"
          },
          cities: [
            {
              code: "NAN",
              name: {
                en: "Nadi",
                fr: "Nadi",
                ar: "نادي"
              }
            },
            {
              code: "LAU",
              name: {
                en: "Lautoka",
                fr: "Lautoka",
                ar: "لاوتوكا"
              }
            }
          ]
        }
      ]
    },
    {
      code: "PG",
      name: {
        en: "Papua New Guinea",
        fr: "Papouasie-Nouvelle-Guinée",
        ar: "بابوا غينيا الجديدة"
      },
      provinces: [
        {
          code: "NCD",
          name: {
            en: "National Capital District",
            fr: "District de la Capitale Nationale",
            ar: "منطقة العاصمة الوطنية"
          },
          cities: [
            {
              code: "POM",
              name: {
                en: "Port Moresby",
                fr: "Port Moresby",
                ar: "بورت مورسبي"
              }
            }
          ]
        },
        {
          code: "CPK",
          name: {
            en: "Chimbu",
            fr: "Chimbu",
            ar: "تشيمبو"
          },
          cities: [
            {
              code: "KUN",
              name: {
                en: "Kundiawa",
                fr: "Kundiawa",
                ar: "كوندياوا"
              }
            }
          ]
        }
      ]
    }
  ]
};
