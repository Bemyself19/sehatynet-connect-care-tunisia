// Main location data aggregator - using direct imports for better error handling
// Import placeholder for empty data
const emptyLocationData: LocationData = { countries: [] };

// Directly import the location data files
// We'll fall back to empty arrays if imports fail
import { africaData as importedAfricaData } from './africa';
import { europeData as importedEuropeData } from './europe';
import { asiaData as importedAsiaData } from './asia';
import { northAmericaData as importedNorthAmericaData } from './north-america';
import { southAmericaData as importedSouthAmericaData } from './south-america';
import { oceaniaData as importedOceaniaData } from './oceania';

// Import expanded data files
import { europeData as expandedEuropeData } from './expanded-europe';
import { northAmericaData as expandedNorthAmericaData } from './expanded-north-america';
import { asiaData as expandedAsiaData } from './expanded-asia';
import { africaData as expandedAfricaData } from './expanded-africa';
import { southAmericaData as expandedSouthAmericaData } from './expanded-south-america';
import { oceaniaData as expandedOceaniaData } from './expanded-oceania';

// Ensure we have proper location data - directly import original data if needed
import { locationData as originalLocationData } from '../locations';

// Use expanded data where available, otherwise use original data or fall back to empty data
const africaData = expandedAfricaData || importedAfricaData || emptyLocationData;
const europeData = expandedEuropeData || importedEuropeData || emptyLocationData;
const asiaData = expandedAsiaData || importedAsiaData || emptyLocationData;
const northAmericaData = expandedNorthAmericaData || importedNorthAmericaData || emptyLocationData;
const southAmericaData = expandedSouthAmericaData || importedSouthAmericaData || emptyLocationData;
const oceaniaData = expandedOceaniaData || importedOceaniaData || emptyLocationData;

// Log what was loaded
console.log('Location data loaded:', {
  africa: africaData.countries.length,
  europe: europeData.countries.length,
  asia: asiaData.countries.length,
  northAmerica: northAmericaData.countries.length,
  southAmerica: southAmericaData.countries.length,
  oceania: oceaniaData.countries.length
});

// Count total cities and provinces
const countLocationStats = () => {
  let totalCountries = 0;
  let totalProvinces = 0;
  let totalCities = 0;

  // Combine all continent data
  const allCountries = [
    ...africaData.countries,
    ...europeData.countries,
    ...asiaData.countries,
    ...northAmericaData.countries,
    ...southAmericaData.countries,
    ...oceaniaData.countries
  ];

  totalCountries = allCountries.length;

  allCountries.forEach(country => {
    totalProvinces += country.provinces.length;
    country.provinces.forEach(province => {
      totalCities += province.cities.length;
    });
  });

  console.log(`Loaded ${totalCountries} countries, ${totalProvinces} provinces/states, and ${totalCities} cities.`);
};

countLocationStats();

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

// Combine all continent data
// If no countries are loaded, fallback to the original location data
const continentCountries = [
  ...africaData.countries,
  ...europeData.countries,
  ...asiaData.countries,
  ...northAmericaData.countries,
  ...southAmericaData.countries,
  ...oceaniaData.countries
];

export const locationData: LocationData = {
  countries: continentCountries.length > 0 ? continentCountries : originalLocationData.countries
};

// Helper functions for the LocationSelector component
export const getCountries = (): Country[] => {
  // Log the country data to help with debugging
  console.log('getCountries called, returning:', locationData.countries.length, 'countries');
  
  // Always use the locationData which now has the fallback built in
  return locationData.countries;
};

export const getProvincesByCountry = (countryCode: string): Province[] => {
  const country = locationData.countries.find(country => country.code === countryCode);
  return country?.provinces || [];
};

export const getCitiesByProvince = (countryCode: string, provinceCode: string): City[] => {
  const country = locationData.countries.find(country => country.code === countryCode);
  const province = country?.provinces.find(province => province.code === provinceCode);
  return province?.cities || [];
};

export const getCountryName = (countryCode: string, language: 'en' | 'fr' | 'ar' = 'en') => {
  const country = locationData.countries.find(c => c.code === countryCode);
  return country?.name[language] || '';
};

export const getProvinceName = (countryCode: string, provinceCode: string, language: 'en' | 'fr' | 'ar' = 'en') => {
  const country = locationData.countries.find(c => c.code === countryCode);
  const province = country?.provinces.find(p => p.code === provinceCode);
  return province?.name[language] || '';
};

export const getCityName = (countryCode: string, provinceCode: string, cityCode: string, language: 'en' | 'fr' | 'ar' = 'en') => {
  const country = locationData.countries.find(c => c.code === countryCode);
  const province = country?.provinces.find(p => p.code === provinceCode);
  const city = province?.cities.find(c => c.code === cityCode);
  return city?.name[language] || '';
};