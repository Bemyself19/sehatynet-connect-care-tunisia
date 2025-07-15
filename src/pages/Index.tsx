import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { 
  Globe, 
  Heart, 
  Shield, 
  Clock, 
  Users, 
  Activity, 
  CheckCircle, 
  ArrowRight, 
  Play,
  Video,
  Stethoscope,
  Pill,
  Microscope,
  Monitor,
  Smartphone,
  Zap,
  Star,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandLogo } from '@/components/ui/logo';

const Index = () => {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
  };

  return (
    <div className={`min-h-screen bg-white ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center group">
              <BrandLogo size={32} />
            </Link>
            
            {/* Language Switcher */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-1 border border-gray-200">
                <Globe className="h-4 w-4 text-gray-600" />
                <select 
                  value={i18n.language} 
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-transparent border-none text-sm focus:outline-none focus:ring-0"
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
              
              <div className="flex space-x-2">
                <Link to="/auth/login-selection">
                  <Button variant="outline" className="hover:bg-gray-50">
                    {t('login') || 'Login'}
                  </Button>
                </Link>
                <Link to="/auth/register-selection">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    {t('register') || 'Register'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="mb-6">
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                  <MapPin className="h-4 w-4 mr-2" />
                  {t('tunisianHealthcareExcellence') || 'Tunisian Healthcare Excellence'}
                </div>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {t('connectWithTunisian') || 'Connect with Tunisian'}
                </span>
                <br />
                <span className="text-gray-900">
                  {t('healthcareProfessionals') || 'Healthcare Professionals'}
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl leading-relaxed">
                {t('heroSubtitleNew') || 'Access world-class healthcare from anywhere. Connect with experienced Tunisian doctors, labs, pharmacists, and radiologists serving North Africa, Central Africa, and beyond.'}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Link to="/auth/register-selection">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-3 shadow-lg">
                    {t('getStarted') || 'Get Started'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-2 hover:bg-gray-50">
                  <Play className="mr-2 h-5 w-5" />
                  {t('watchDemo') || 'Watch Demo'}
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-green-500" />
                  {t('hipaaCompliant') || 'HIPAA Compliant'}
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-2 text-yellow-500" />
                  {t('trustedByThousands') || 'Trusted by 50K+ Users'}
                </div>
                <div className="flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-blue-500" />
                  {t('instantAccess') || 'Instant Access'}
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <video 
                  src="/consultation-video.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-96 object-cover"
                  aria-label="Doctor and patient having an online consultation"
                >
                  {/* Fallback for browsers that don't support video */}
                  <img 
                    src="https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1050&q=80"
                    alt="Doctor taking a video call with a patient"
                    className="w-full h-96 object-cover"
                  />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('seeSehatyNetInAction') || 'See SehatyNet+ in Action'}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('watchHowHealthcareProfessionals') || 'Watch how healthcare professionals and patients connect seamlessly across borders'}
            </p>
          </div>
          
          <div className="relative max-w-4xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              {/* Main consultation video */}
              <video 
                src="/consultation-video.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full aspect-video object-cover"
                aria-label="Healthcare professionals and patients using SehatyNet+ platform"
              >
                {/* Fallback placeholder */}
                <div className="aspect-video bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Video className="h-16 w-16 mx-auto mb-4 opacity-80" />
                    <p className="text-lg font-medium mb-2">
                      {t('sampleVideoTitle') || 'Sample Video: Healthcare in Action'}
                    </p>
                    <p className="text-sm opacity-80">
                      {t('replaceWithActualVideo') || 'Video showing doctor and patient consultation'}
                    </p>
                  </div>
                </div>
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('comprehensiveHealthcarePlatform') || 'Comprehensive Healthcare Platform'}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t('everythingYouNeed') || 'Everything you need for modern healthcare management, from appointments to prescriptions, all in one secure platform'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Doctor Consultations */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">{t('doctorConsultations') || 'Doctor Consultations'}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 text-base">
                  {t('connectWithSpecialists') || 'Connect with experienced Tunisian specialists for video consultations, second opinions, and ongoing care'}
                </CardDescription>
              </CardContent>
            </Card>
            
            {/* Lab Services */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Microscope className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">{t('labServices') || 'Lab Services'}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 text-base">
                  {t('comprehensiveLabTesting') || 'Comprehensive lab testing with secure result sharing and expert interpretation'}
                </CardDescription>
              </CardContent>
            </Card>
            
            {/* Pharmacy */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-violet-50">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Pill className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">{t('pharmacyServices') || 'Pharmacy Services'}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 text-base">
                  {t('ePrescriptionsMedication') || 'E-prescriptions, medication management, and delivery services'}
                </CardDescription>
              </CardContent>
            </Card>
            
            {/* Radiology */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-red-50">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Monitor className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-xl">{t('radiologyServices') || 'Radiology Services'}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 text-base">
                  {t('advancedImagingDiagnostics') || 'Advanced imaging diagnostics with expert radiologist interpretation'}
                </CardDescription>
              </CardContent>
            </Card>
            
            {/* Mobile Access */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-teal-50 to-cyan-50">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="h-8 w-8 text-teal-600" />
                </div>
                <CardTitle className="text-xl">{t('mobileAccess') || 'Mobile Access'}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 text-base">
                  {t('accessHealthcareAnywhere') || 'Access healthcare services anywhere, anytime with our mobile-first platform'}
                </CardDescription>
              </CardContent>
            </Card>
            
            {/* Multilingual Support */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-pink-50 to-rose-50">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-pink-600" />
                </div>
                <CardTitle className="text-xl">{t('multilingualSupport') || 'Multilingual Support'}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600 text-base">
                  {t('englishFrenchArabic') || 'Full support in English, French, and Arabic for global accessibility'}
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('trustedByThousands') || 'Trusted by Thousands'}
            </h2>
            <p className="text-xl opacity-90">
              {t('servingNorthAfrica') || 'Serving North Africa, Central Africa, and beyond'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-blue-100">{t('activeUsers') || 'Active Users'}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">{t('healthcareProviders') || 'Healthcare Providers'}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">25+</div>
              <div className="text-blue-100">{t('countriesServed') || 'Countries Served'}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">{t('uptime') || 'Uptime'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('readyToGetStarted') || 'Ready to Get Started?'}
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            {t('joinThousandsOfUsers') || 'Join thousands of users who trust SehatyNet+ for their healthcare needs'}
          </p>
          <Link to="/auth/register-selection">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-3 shadow-lg">
              {t('getStartedNow') || 'Get Started Now'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
