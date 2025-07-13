// Location data for Tunisia and international locations
export interface LocationData {
  countries: Country[];
}

export interface Country {
  code: string;
  name: {
    en: string;
    fr: string;
    ar: string;
  };
  provinces: Province[];
}

export interface Province {
  code: string;
  name: {
    en: string;
    fr: string;
    ar: string;
  };
  cities: City[];
}

export interface City {
  code: string;
  name: {
    en: string;
    fr: string;
    ar: string;
  };
}

export const locationData: LocationData = {
  countries: [
    {
      code: "TN",
      name: {
        en: "Tunisia",
        fr: "Tunisie",
        ar: "تونس"
      },
      provinces: [
        {
          code: "TN-11",
          name: {
            en: "Tunis",
            fr: "Tunis",
            ar: "تونس"
          },
          cities: [
            {
              code: "TN-11-001",
              name: {
                en: "Tunis",
                fr: "Tunis",
                ar: "تونس"
              }
            },
            {
              code: "TN-11-002",
              name: {
                en: "La Marsa",
                fr: "La Marsa",
                ar: "المرسى"
              }
            },
            {
              code: "TN-11-003",
              name: {
                en: "Carthage",
                fr: "Carthage",
                ar: "قرطاج"
              }
            },
            {
              code: "TN-11-004",
              name: {
                en: "Sidi Bou Said",
                fr: "Sidi Bou Said",
                ar: "سيدي بوسعيد"
              }
            },
            {
              code: "TN-11-005",
              name: {
                en: "Ariana",
                fr: "Ariana",
                ar: "أريانة"
              }
            }
          ]
        },
        {
          code: "TN-12",
          name: {
            en: "Sfax",
            fr: "Sfax",
            ar: "صفاقس"
          },
          cities: [
            {
              code: "TN-12-001",
              name: {
                en: "Sfax",
                fr: "Sfax",
                ar: "صفاقس"
              }
            },
            {
              code: "TN-12-002",
              name: {
                en: "Sakiet Ezzit",
                fr: "Sakiet Ezzit",
                ar: "ساقية الزيت"
              }
            }
          ]
        },
        {
          code: "TN-13",
          name: {
            en: "Sousse",
            fr: "Sousse",
            ar: "سوسة"
          },
          cities: [
            {
              code: "TN-13-001",
              name: {
                en: "Sousse",
                fr: "Sousse",
                ar: "سوسة"
              }
            },
            {
              code: "TN-13-002",
              name: {
                en: "Hammam Sousse",
                fr: "Hammam Sousse",
                ar: "حمام سوسة"
              }
            }
          ]
        },
        {
          code: "TN-31",
          name: {
            en: "Bizerte",
            fr: "Bizerte",
            ar: "بنزرت"
          },
          cities: [
            {
              code: "TN-31-001",
              name: {
                en: "Bizerte",
                fr: "Bizerte",
                ar: "بنزرت"
              }
            }
          ]
        },
        {
          code: "TN-41",
          name: {
            en: "Nabeul",
            fr: "Nabeul",
            ar: "نابل"
          },
          cities: [
            {
              code: "TN-41-001",
              name: {
                en: "Nabeul",
                fr: "Nabeul",
                ar: "نابل"
              }
            },
            {
              code: "TN-41-002",
              name: {
                en: "Hammamet",
                fr: "Hammamet",
                ar: "الحمامات"
              }
            }
          ]
        }
      ]
    },
    {
      code: "FR",
      name: {
        en: "France",
        fr: "France",
        ar: "فرنسا"
      },
      provinces: [
        {
          code: "FR-75",
          name: {
            en: "Paris",
            fr: "Paris",
            ar: "باريس"
          },
          cities: [
            {
              code: "FR-75-001",
              name: {
                en: "Paris",
                fr: "Paris",
                ar: "باريس"
              }
            }
          ]
        },
        {
          code: "FR-13",
          name: {
            en: "Bouches-du-Rhône",
            fr: "Bouches-du-Rhône",
            ar: "بوش دو رون"
          },
          cities: [
            {
              code: "FR-13-001",
              name: {
                en: "Marseille",
                fr: "Marseille",
                ar: "مرسيليا"
              }
            }
          ]
        }
      ]
    },
    {
      code: "CA",
      name: {
        en: "Canada",
        fr: "Canada",
        ar: "كندا"
      },
      provinces: [
        {
          code: "CA-QC",
          name: {
            en: "Quebec",
            fr: "Québec",
            ar: "كيبيك"
          },
          cities: [
            {
              code: "CA-QC-001",
              name: {
                en: "Montreal",
                fr: "Montréal",
                ar: "مونتريال"
              }
            },
            {
              code: "CA-QC-002",
              name: {
                en: "Quebec City",
                fr: "Ville de Québec",
                ar: "مدينة كيبيك"
              }
            }
          ]
        },
        {
          code: "CA-ON",
          name: {
            en: "Ontario",
            fr: "Ontario",
            ar: "أونتاريو"
          },
          cities: [
            {
              code: "CA-ON-001",
              name: {
                en: "Toronto",
                fr: "Toronto",
                ar: "تورونتو"
              }
            },
            {
              code: "CA-ON-002",
              name: {
                en: "Ottawa",
                fr: "Ottawa",
                ar: "أوتاوا"
              }
            }
          ]
        }
      ]
    },
    {
      code: "US",
      name: {
        en: "United States",
        fr: "États-Unis",
        ar: "الولايات المتحدة"
      },
      provinces: [
        {
          code: "US-NY",
          name: {
            en: "New York",
            fr: "New York",
            ar: "نيويورك"
          },
          cities: [
            {
              code: "US-NY-001",
              name: {
                en: "New York City",
                fr: "New York",
                ar: "نيويورك"
              }
            }
          ]
        },
        {
          code: "US-CA",
          name: {
            en: "California",
            fr: "Californie",
            ar: "كاليفورنيا"
          },
          cities: [
            {
              code: "US-CA-001",
              name: {
                en: "Los Angeles",
                fr: "Los Angeles",
                ar: "لوس أنجلوس"
              }
            },
            {
              code: "US-CA-002",
              name: {
                en: "San Francisco",
                fr: "San Francisco",
                ar: "سان فرانسيسكو"
              }
            }
          ]
        }
      ]
    }
  ]
};

export const getCountries = () => locationData.countries;

export const getProvincesByCountry = (countryCode: string) => {
  const country = locationData.countries.find(c => c.code === countryCode);
  return country ? country.provinces : [];
};

export const getCitiesByProvince = (countryCode: string, provinceCode: string) => {
  const country = locationData.countries.find(c => c.code === countryCode);
  if (!country) return [];
  
  const province = country.provinces.find(p => p.code === provinceCode);
  return province ? province.cities : [];
};

export const getLocationName = (code: string, language: 'en' | 'fr' | 'ar' = 'en') => {
  // Search through all countries, provinces, and cities
  for (const country of locationData.countries) {
    if (country.code === code) return country.name[language];
    
    for (const province of country.provinces) {
      if (province.code === code) return province.name[language];
      
      for (const city of province.cities) {
        if (city.code === code) return city.name[language];
      }
    }
  }
  return '';
};
