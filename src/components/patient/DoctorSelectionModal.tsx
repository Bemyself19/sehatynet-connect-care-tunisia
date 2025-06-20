
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Modal from '@/components/ui/modal';
import { Search, User, MessageCircle } from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: string;
  consultationFee: number;
  cnamId: string;
}

interface DoctorSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDoctor: (doctor: Doctor) => void;
}

const DoctorSelectionModal: React.FC<DoctorSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectDoctor
}) => {
  const [selectionMode, setSelectionMode] = useState<'browse' | 'chatbot'>('browse');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'bot', message: string}>>([]);
  const [userInput, setUserInput] = useState('');

  const doctors: Doctor[] = [
    { id: '1', name: 'Dr. Sarah Johnson', specialty: 'Cardiologist', rating: 4.8, experience: '10 years', consultationFee: 150, cnamId: 'CNAM123456' },
    { id: '2', name: 'Dr. Ahmed Hassan', specialty: 'General Practitioner', rating: 4.6, experience: '8 years', consultationFee: 100, cnamId: 'CNAM789012' },
    { id: '3', name: 'Dr. Maria Rodriguez', specialty: 'Dermatologist', rating: 4.9, experience: '12 years', consultationFee: 120, cnamId: 'CNAM345678' },
    { id: '4', name: 'Dr. James Wilson', specialty: 'Orthopedist', rating: 4.7, experience: '15 years', consultationFee: 180, cnamId: 'CNAM901234' }
  ];

  const specialties = [
    'General Practitioner',
    'Cardiologist',
    'Dermatologist',
    'Orthopedist',
    'Neurologist',
    'Pediatrician'
  ];

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSpecialty = !selectedSpecialty || doctor.specialty === selectedSpecialty;
    const matchesSearch = !searchQuery || doctor.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpecialty && matchesSearch;
  });

  const handleChatSubmit = () => {
    if (!userInput.trim()) return;

    const newMessages = [...chatMessages, { role: 'user' as const, message: userInput }];
    
    // Simple chatbot logic - in real implementation, this would use an LLM
    let botResponse = "Based on your symptoms, I recommend consulting with a General Practitioner first. ";
    if (userInput.toLowerCase().includes('chest') || userInput.toLowerCase().includes('heart')) {
      botResponse = "Your symptoms suggest you should see a Cardiologist. Here are some recommendations:";
    } else if (userInput.toLowerCase().includes('skin') || userInput.toLowerCase().includes('rash')) {
      botResponse = "For skin-related issues, I recommend seeing a Dermatologist:";
    }

    newMessages.push({ role: 'bot', message: botResponse });
    setChatMessages(newMessages);
    setUserInput('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select a Doctor">
      <div className="space-y-6">
        {/* Selection Mode Toggle */}
        <div className="flex space-x-2">
          <Button
            variant={selectionMode === 'browse' ? 'default' : 'outline'}
            onClick={() => setSelectionMode('browse')}
            className="flex-1"
          >
            <Search className="h-4 w-4 mr-2" />
            Browse Doctors
          </Button>
          <Button
            variant={selectionMode === 'chatbot' ? 'default' : 'outline'}
            onClick={() => setSelectionMode('chatbot')}
            className="flex-1"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
        </div>

        {selectionMode === 'browse' ? (
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Specialties</SelectItem>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Search doctors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Doctors List */}
            <div className="max-h-96 overflow-y-auto space-y-3">
              {filteredDoctors.map((doctor) => (
                <Card key={doctor.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{doctor.name}</h3>
                        <p className="text-sm text-gray-600">{doctor.specialty}</p>
                        <p className="text-sm text-gray-500">{doctor.experience} experience</p>
                        <p className="text-sm text-gray-500">CNAM ID: {doctor.cnamId}</p>
                        <div className="flex items-center mt-2">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm ml-1">{doctor.rating}</span>
                          <span className="text-sm text-gray-500 ml-4">${doctor.consultationFee}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onSelectDoctor(doctor)}
                      >
                        Select
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chat Interface */}
            <div className="border rounded-lg h-64 overflow-y-auto p-4 bg-gray-50">
              {chatMessages.length === 0 && (
                <p className="text-gray-500 text-center mt-8">
                  Tell me about your symptoms and I'll help you find the right doctor.
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
                placeholder="Describe your symptoms..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
              />
              <Button onClick={handleChatSubmit}>Send</Button>
            </div>

            {/* Recommended Doctors (after chat) */}
            {chatMessages.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Recommended Doctors:</h4>
                {filteredDoctors.slice(0, 2).map((doctor) => (
                  <Card key={doctor.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{doctor.name}</h3>
                          <p className="text-sm text-gray-600">{doctor.specialty}</p>
                          <p className="text-sm text-gray-500">${doctor.consultationFee}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => onSelectDoctor(doctor)}
                        >
                          Select
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default DoctorSelectionModal;
