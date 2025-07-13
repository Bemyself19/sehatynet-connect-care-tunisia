import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Modal from '@/components/ui/modal';
import { Search, User as UserIcon, MessageCircle, AlertCircle } from 'lucide-react';
import { Provider } from '@/types/user';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser } from '@/hooks/useUser';

interface DoctorSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDoctor: (doctor: Provider) => void;
}

const DoctorSelectionModal: React.FC<DoctorSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectDoctor
}) => {
  const { t } = useTranslation();
  const [selectionMode, setSelectionMode] = useState<'browse' | 'chatbot'>('browse');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'bot', message: string}>>([]);
  const [userInput, setUserInput] = useState('');
  const [paymentsEnabled, setPaymentsEnabled] = useState(true);
  const { user } = useUser();
  const [isInternationalPatient, setIsInternationalPatient] = useState(false);

  const [doctors, setDoctors] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchDoctors = async () => {
        try {
          setIsLoading(true);
          const providers = await api.getProviders({ role: 'doctor' });
          setDoctors(providers);
          setError(null);
        } catch (err) {
          setError('Failed to fetch doctors. Please try again.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDoctors();
    }
  }, [isOpen]);

  // Fetch system settings to check if payments are enabled
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const settings = await api.getSystemSettings();
        console.log('System settings received:', settings);
        
        // Check if paymentsEnabled is specifically set to true
        const enabled = settings && settings.paymentsEnabled === true;
        console.log('Setting paymentsEnabled to:', enabled);
        setPaymentsEnabled(enabled);
        
        // Log the state of the settings for debugging
        if (enabled) {
          console.log('Payment features are ENABLED in doctor selection');
        } else {
          console.log('Payment features are DISABLED in doctor selection');
        }
      } catch (err) {
        console.error('Failed to fetch system settings:', err);
        setPaymentsEnabled(false); // Default to disabled if there's an error
      }
    };
    
    if (isOpen) {
      fetchPaymentSettings();
    } else {
      // Initialize with payments disabled by default until settings are fetched
      setPaymentsEnabled(false);
    }
  }, [isOpen]);

  // Determine if patient is international (outside Tunisia)
  useEffect(() => {
    if (user && user.role === 'patient') {
      // Use type assertion to access country property
      const patientUser = user as { country?: string };
      const patientCountry = patientUser.country || '';
      
      // Check if patient is international (not from Tunisia)
      // Looking for 'tunisia' in various forms (lowercase, with country code, etc.)
      const isInternational = patientCountry !== '' && 
        !['tunisia', 'tn', 'تونس'].includes(patientCountry.toLowerCase());
      
      setIsInternationalPatient(isInternational);
    }
  }, [user]);

  const specialties = [...new Set(doctors.map(d => d.specialization).filter(Boolean))].sort() as string[];

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSpecialty = !selectedSpecialty || doctor.specialization === selectedSpecialty;
    const matchesSearch = !searchQuery || `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpecialty && matchesSearch;
  });

  const groupedDoctors = filteredDoctors.reduce((acc, doctor) => {
    const specialty = doctor.specialization || 'General';
    if (!acc[specialty]) {
      acc[specialty] = [];
    }
    acc[specialty].push(doctor);
    return acc;
  }, {} as Record<string, Provider[]>);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newMessages = [...chatMessages, { role: 'user' as const, message: userInput }];
    
    // Simple chatbot logic - in real implementation, this would use an LLM
    let botResponse = t('chatbotGeneralResponse') || "Based on your symptoms, I recommend consulting with a General Practitioner first. ";
    if (userInput.toLowerCase().includes('chest') || userInput.toLowerCase().includes('heart')) {
      botResponse = t('chatbotCardiologyResponse') || "Your symptoms suggest you should see a Cardiologist. Here are some recommendations:";
    } else if (userInput.toLowerCase().includes('skin') || userInput.toLowerCase().includes('rash')) {
      botResponse = t('chatbotDermatologyResponse') || "For skin-related issues, I recommend seeing a Dermatologist:";
    }

    newMessages.push({ role: 'bot', message: botResponse });
    setChatMessages(newMessages);
    setUserInput('');
  };

  // Helper function to get the appropriate fee and currency for a doctor
  const getDoctorFeeDisplay = (doctor: Provider) => {
    // If payments are disabled, don't display fees
    if (!paymentsEnabled) {
      console.log(`Fee display skipped for doctor ${doctor._id} - payments disabled`);
      return '';
    }
    
    let fee: number | undefined;
    let currency: string;
    
    // For international patients, use international fee in EUR
    if (isInternationalPatient) {
      // First try international fee
      if (doctor.internationalConsultationFee !== undefined && doctor.internationalConsultationFee !== null) {
        fee = Number(doctor.internationalConsultationFee);
        currency = t('internationalCurrency') || 'EUR';
        console.log(`International fee found for doctor ${doctor._id}: ${fee} ${currency}`);
      } else {
        console.log(`No international fee set for doctor ${doctor._id}`);
      }
    } 
    // For local patients, use local fee in TND
    else {
      // Try local fee first, then fall back to legacy consultationFee
      if (doctor.localConsultationFee !== undefined && doctor.localConsultationFee !== null) {
        fee = Number(doctor.localConsultationFee);
        console.log(`Local fee found for doctor ${doctor._id}: ${fee} TND`);
      } else if (doctor.consultationFee !== undefined && doctor.consultationFee !== null) {
        fee = Number(doctor.consultationFee);
        console.log(`Legacy fee found for doctor ${doctor._id}: ${fee} TND`);
      } else {
        console.log(`No fee set for doctor ${doctor._id}`);
      }
      currency = t('currency') || 'TND';
    }
    
    // If we have a valid fee (not undefined, not NaN, not zero, not empty string), display it with currency
    if (fee !== undefined && !isNaN(fee) && fee > 0) {
      const feeDisplay = `${t('consultationFee')}: ${fee} ${currency}`;
      console.log(`Displaying fee for doctor ${doctor._id}: "${feeDisplay}"`);
      return feeDisplay;
    }
    
    // If no appropriate fee was found, use the "not set" message or return empty
    const result = isInternationalPatient ? "" : (t('feeNotSet') || 'Fee not set');
    if (result) {
      console.log(`Displaying "fee not set" for doctor ${doctor._id}`);
    }
    return result;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('selectDoctor') || 'Select a Doctor'}>
      <div className="space-y-6">
        {/* Selection Mode Toggle */}
        <div className="flex space-x-2">
          <Button
            variant={selectionMode === 'browse' ? 'default' : 'outline'}
            onClick={() => setSelectionMode('browse')}
            className="flex-1"
          >
            <Search className="h-4 w-4 mr-2" />
            {t('browseDoctors') || 'Browse Doctors'}
          </Button>
          <Button
            variant={selectionMode === 'chatbot' ? 'default' : 'outline'}
            onClick={() => setSelectionMode('chatbot')}
            className="flex-1"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {t('aiAssistant') || 'AI Assistant'}
          </Button>
        </div>

        {selectionMode === 'browse' ? (
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectSpecialty') || 'Select Specialty'} />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty === 'General' || specialty === 'generalpractitioner'
                          ? t('generalpractitioner')
                          : t(specialty.replace(/ /g, '').replace(/([A-Z])/g, (m) => m.toLowerCase()))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder={t('searchDoctors') || 'Search doctors...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Doctors List */}
            {isLoading ? (
              <div className="text-center">{t('loadingDoctors') || 'Loading doctors...'}</div>
            ) : error ? (
              <div className="text-center text-red-500">{error}</div>
            ) : Object.keys(groupedDoctors).length > 0 ? (
              <ScrollArea className="h-[400px]">
                {Object.entries(groupedDoctors).map(([specialty, docs]) => (
                  <div key={specialty} className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-2">
                      {specialty === 'General' ? t('generalPractitioner') : t(specialty.replace(/ /g, '').replace(/([A-Z])/g, (m) => m.toLowerCase()))}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {docs.map(doctor => (
                        <Card key={doctor._id} className="cursor-pointer hover:bg-gray-50" onClick={() => onSelectDoctor(doctor)}>
                          <CardHeader>
                            <CardTitle className="text-base">{doctor.firstName} {doctor.lastName}</CardTitle>
                            <CardDescription>{doctor.specialization ? t(
                              doctor.specialization.replace(/ /g, '').replace(/([A-Z])/g, (m) => m.toLowerCase())
                            ) : t('generalPractitioner')}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-gray-600">{doctor.specialization ? t(
                                doctor.specialization.replace(/ /g, '').replace(/([A-Z])/g, (m) => m.toLowerCase())
                              ) : t('generalPractitioner')}</p>
                              {/* Fee display - only shown when payments are enabled */}
                              {paymentsEnabled && getDoctorFeeDisplay(doctor) && (
                                <p className="text-sm font-semibold text-blue-600" data-testid={`fee-${doctor._id}`}>
                                  {getDoctorFeeDisplay(doctor)}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {t('noDoctorsFound') || 'No doctors found matching your criteria.'}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 h-[500px] flex flex-col">
            <ScrollArea className="flex-1 p-4 border rounded-md">
              {/* Chat Interface */}
              <div className="border rounded-lg h-64 overflow-y-auto p-4 bg-gray-50">
                {chatMessages.length === 0 && (
                  <p className="text-gray-500 text-center mt-8">
                    {t('chatbotWelcomeMessage') || "Tell me about your symptoms and I'll help you find the right doctor."}
                  </p>
                )}
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-2 rounded-lg max-w-xs ${
                      msg.role === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white border'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="flex space-x-2">
                <Input
                  placeholder={t('describeSymptoms') || 'Describe your symptoms...'}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit(e)}
                />
                <Button onClick={handleChatSubmit}>{t('send') || 'Send'}</Button>
              </div>

              {/* Recommended Doctors (after chat) */}
              {chatMessages.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Recommended Doctors:</h4>
                  {filteredDoctors.slice(0, 2).map((doctor) => (
                    <Card key={doctor._id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold">{`${doctor.firstName} ${doctor.lastName}`}</h3>
                            <p className="text-sm text-gray-600">{doctor.specialization ? t(
                              doctor.specialization.replace(/ /g, '').replace(/([A-Z])/g, (m) => m.toLowerCase())
                            ) : ''}</p>
                            {/* Fee display - only shown when payments are enabled */}
                            {paymentsEnabled && getDoctorFeeDisplay(doctor) && (
                              <p className="text-sm text-gray-500" data-testid={`chatbot-fee-${doctor._id}`}>
                                {getDoctorFeeDisplay(doctor)}
                              </p>
                            )}
                          </div>
                          <Button size="sm" onClick={() => onSelectDoctor(doctor)}>Select</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DoctorSelectionModal;
