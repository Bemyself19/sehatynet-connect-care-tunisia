import React, { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { getCountries, getProvincesByCountry, getCitiesByProvince, Country, Province, City } from '@/data/locations/index';
import { X } from 'lucide-react';

interface LocationSelectorProps {
  selectedCountry?: string;
  selectedProvince?: string;
  selectedCity?: string;
  onCountryChange?: (countryCode: string) => void;
  onProvinceChange?: (provinceCode: string) => void;
  onCityChange?: (cityCode: string) => void;
  disabled?: boolean;
  required?: boolean;
  showLabels?: boolean;
  className?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedCountry,
  selectedProvince,
  selectedCity,
  onCountryChange,
  onProvinceChange,
  onCityChange,
  disabled = false,
  required = false,
  showLabels = true,
  className = ''
}) => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as 'en' | 'fr' | 'ar';
  
  const countriesList = getCountries();
  
  // State for the actual data
  const [countries] = useState<Country[]>(countriesList);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  
  // State for search inputs
  const [countrySearch, setCountrySearch] = useState('');
  const [provinceSearch, setProvinceSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  
  // Filtered lists based on search terms
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return countries;
    
    const searchTermLower = countrySearch.toLowerCase();
    return countries.filter(country => 
      country.name.en.toLowerCase().includes(searchTermLower) || 
      country.name.fr.toLowerCase().includes(searchTermLower) ||
      country.name.ar.includes(countrySearch)
    );
  }, [countries, countrySearch]);
  
  const filteredProvinces = useMemo(() => {
    if (!provinceSearch.trim()) return provinces;
    
    const searchTermLower = provinceSearch.toLowerCase();
    return provinces.filter(province => 
      province.name.en.toLowerCase().includes(searchTermLower) || 
      province.name.fr.toLowerCase().includes(searchTermLower) ||
      province.name.ar.includes(provinceSearch)
    );
  }, [provinces, provinceSearch]);
  
  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return cities;
    
    const searchTermLower = citySearch.toLowerCase();
    return cities.filter(city => 
      city.name.en.toLowerCase().includes(searchTermLower) || 
      city.name.fr.toLowerCase().includes(searchTermLower) ||
      city.name.ar.includes(citySearch)
    );
  }, [cities, citySearch]);

  // Update provinces when country changes
  useEffect(() => {
    if (selectedCountry) {
      const countryProvinces = getProvincesByCountry(selectedCountry);
      setProvinces(countryProvinces);
      
      // Reset province and city if the selected ones are not in the new country
      if (selectedProvince && !countryProvinces.find(p => p.code === selectedProvince)) {
        onProvinceChange?.('');
        onCityChange?.('');
      }
      
      // Clear search filters when country changes
      setProvinceSearch('');
      setCitySearch('');
    } else {
      setProvinces([]);
      setCities([]);
    }
  }, [selectedCountry, selectedProvince, onProvinceChange, onCityChange]);

  // Update cities when province changes
  useEffect(() => {
    if (selectedCountry && selectedProvince) {
      const provinceCities = getCitiesByProvince(selectedCountry, selectedProvince);
      setCities(provinceCities);
      
      // Reset city if the selected one is not in the new province
      if (selectedCity && !provinceCities.find(c => c.code === selectedCity)) {
        onCityChange?.('');
      }
      
      // Clear city search filter when province changes
      setCitySearch('');
    } else {
      setCities([]);
    }
  }, [selectedCountry, selectedProvince, selectedCity, onCityChange]);

  const handleCountryChange = (countryCode: string) => {
    console.log('Country selected:', countryCode);
    onCountryChange?.(countryCode);
    // Clear province and city when country changes
    onProvinceChange?.('');
    onCityChange?.('');
  };

  const handleProvinceChange = (provinceCode: string) => {
    console.log('Province selected:', provinceCode);
    onProvinceChange?.(provinceCode);
    // Clear city when province changes
    onCityChange?.('');
  };
  
  const clearCountrySearch = () => {
    setCountrySearch('');
  };
  
  const clearProvinceSearch = () => {
    setProvinceSearch('');
  };
  
  const clearCitySearch = () => {
    setCitySearch('');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Country Selector */}
      <div className="space-y-2">
        {showLabels && (
          <Label htmlFor="country">
            {t('country')}{required && ' *'}
          </Label>
        )}
        <Select 
          value={selectedCountry || ''} 
          onValueChange={handleCountryChange}
          disabled={disabled}
        >
          <SelectTrigger id="country">
            <SelectValue placeholder={t('selectCountry')}>
              {selectedCountry ? (
                <>
                  {countries.find(c => c.code === selectedCountry)?.name[currentLanguage] || selectedCountry}
                </>
              ) : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <div className="p-2 mb-1">
              <div className="relative">
                <Input
                  placeholder={t('searchCountry')}
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="pl-2 pr-8"
                />
                {countrySearch && (
                  <button 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={clearCountrySearch}
                    type="button"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-[200px] overflow-auto">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name[currentLanguage]}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-center text-gray-500">{t('noResults')}</div>
              )}
            </div>
          </SelectContent>
        </Select>
      </div>

      {/* Province/State Selector */}
      <div className="space-y-2">
        {showLabels && (
          <Label htmlFor="province">
            {t('province')}{required && ' *'}
          </Label>
        )}
        <Select 
          value={selectedProvince || ''} 
          onValueChange={handleProvinceChange}
          disabled={disabled || !selectedCountry || provinces.length === 0}
        >
          <SelectTrigger id="province">
            <SelectValue placeholder={t('selectProvince')}>
              {selectedProvince ? (
                <>
                  {provinces.find(p => p.code === selectedProvince)?.name[currentLanguage] || selectedProvince}
                </>
              ) : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <div className="p-2 mb-1">
              <div className="relative">
                <Input
                  placeholder={t('searchProvince')}
                  value={provinceSearch}
                  onChange={(e) => setProvinceSearch(e.target.value)}
                  className="pl-2 pr-8"
                />
                {provinceSearch && (
                  <button 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={clearProvinceSearch}
                    type="button"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-[200px] overflow-auto">
              {filteredProvinces.length > 0 ? (
                filteredProvinces.map((province) => (
                  <SelectItem key={province.code} value={province.code}>
                    {province.name[currentLanguage]}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-center text-gray-500">{t('noResults')}</div>
              )}
            </div>
          </SelectContent>
        </Select>
      </div>

      {/* City Selector */}
      <div className="space-y-2">
        {showLabels && (
          <Label htmlFor="city">
            {t('city')}{required && ' *'}
          </Label>
        )}
        <Select 
          value={selectedCity || ''} 
          onValueChange={(cityCode) => onCityChange?.(cityCode)}
          disabled={disabled || !selectedProvince || cities.length === 0}
        >
          <SelectTrigger id="city">
            <SelectValue placeholder={t('selectCity')}>
              {selectedCity ? (
                <>
                  {cities.find(c => c.code === selectedCity)?.name[currentLanguage] || selectedCity}
                </>
              ) : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <div className="p-2 mb-1">
              <div className="relative">
                <Input
                  placeholder={t('searchCity')}
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="pl-2 pr-8"
                />
                {citySearch && (
                  <button 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={clearCitySearch}
                    type="button"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-[200px] overflow-auto">
              {filteredCities.length > 0 ? (
                filteredCities.map((city) => (
                  <SelectItem key={city.code} value={city.code}>
                    {city.name[currentLanguage]}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-center text-gray-500">{t('noResults')}</div>
              )}
            </div>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
