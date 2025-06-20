
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Modal from '@/components/ui/modal';
import { Pill, TestTube, Scan, FileText, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

interface Prescription {
  id: string;
  type: 'medication' | 'lab_test' | 'radiology';
  details: string;
  doctorName: string;
  doctorCnamId: string;
  patientName: string;
  patientCnamId: string;
  qrCode: string;
  date: string;
}

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: Prescription;
}

const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  prescription
}) => {
  const [selectedProvider, setSelectedProvider] = useState('');
  const [showQR, setShowQR] = useState(false);

  const pharmacies = [
    { id: '1', name: 'Central Pharmacy', address: '123 Main St', cnamId: 'PHARM001' },
    { id: '2', name: 'City Drugstore', address: '456 Oak Ave', cnamId: 'PHARM002' },
    { id: '3', name: 'HealthPlus Pharmacy', address: '789 Pine Rd', cnamId: 'PHARM003' }
  ];

  const labs = [
    { id: '1', name: 'MediLab Center', address: '321 Health St', cnamId: 'LAB001' },
    { id: '2', name: 'Diagnostic Plus', address: '654 Care Ave', cnamId: 'LAB002' },
    { id: '3', name: 'QuickTest Lab', address: '987 Test Blvd', cnamId: 'LAB003' }
  ];

  const radiologists = [
    { id: '1', name: 'Advanced Imaging', address: '111 Scan St', cnamId: 'RAD001' },
    { id: '2', name: 'Digital Radiology', address: '222 X-ray Ave', cnamId: 'RAD002' },
    { id: '3', name: 'Precision Imaging', address: '333 MRI Rd', cnamId: 'RAD003' }
  ];

  const getProviders = () => {
    switch (prescription.type) {
      case 'medication': return pharmacies;
      case 'lab_test': return labs;
      case 'radiology': return radiologists;
      default: return [];
    }
  };

  const getIcon = () => {
    switch (prescription.type) {
      case 'medication': return <Pill className="h-5 w-5" />;
      case 'lab_test': return <TestTube className="h-5 w-5" />;
      case 'radiology': return <Scan className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getTitle = () => {
    switch (prescription.type) {
      case 'medication': return 'Medication Prescription';
      case 'lab_test': return 'Lab Test Request';
      case 'radiology': return 'Radiology Request';
      default: return 'Prescription';
    }
  };

  const handlePlaceOrder = () => {
    if (!selectedProvider) return;
    
    // In a real app, this would create an order
    console.log('Placing order with provider:', selectedProvider);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()}>
      <div className="space-y-6">
        {/* Prescription Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {getIcon()}
              <span>Prescription Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <strong>Prescription ID:</strong> {prescription.id}
            </div>
            <div>
              <strong>Details:</strong> {prescription.details}
            </div>
            <div>
              <strong>Doctor:</strong> {prescription.doctorName} (CNAM: {prescription.doctorCnamId})
            </div>
            <div>
              <strong>Patient:</strong> {prescription.patientName} (CNAM: {prescription.patientCnamId})
            </div>
            <div>
              <strong>Date:</strong> {prescription.date}
            </div>
            
            <div className="flex space-x-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowQR(!showQR)}
                className="flex items-center space-x-2"
              >
                <QrCode className="h-4 w-4" />
                <span>{showQR ? 'Hide' : 'Show'} QR Code</span>
              </Button>
            </div>

            {showQR && (
              <div className="mt-4 text-center">
                <img 
                  src={prescription.qrCode} 
                  alt="Prescription QR Code" 
                  className="mx-auto border rounded"
                />
                <p className="text-sm text-gray-500 mt-2">
                  QR Code for verification
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Provider Selection */}
        <Card>
          <CardHeader>
            <CardTitle>
              Select {prescription.type === 'medication' ? 'Pharmacy' : 
                     prescription.type === 'lab_test' ? 'Laboratory' : 'Radiology Center'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a provider..." />
              </SelectTrigger>
              <SelectContent>
                {getProviders().map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div>
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-sm text-gray-500">{provider.address}</div>
                      <div className="text-xs text-gray-400">CNAM: {provider.cnamId}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedProvider && (
              <Button onClick={handlePlaceOrder} className="w-full">
                {prescription.type === 'medication' ? 'Place Order' : 'Book Appointment'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </Modal>
  );
};

export default PrescriptionModal;
