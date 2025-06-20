
import React, { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Modal from '@/components/ui/modal';

const MedicalRecords: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const records = [
    {
      id: 1,
      title: 'Blood Test Results',
      date: '2024-01-10',
      provider: 'Central Lab',
      type: 'lab_result',
      details: {
        hemoglobin: '14.2 g/dL',
        whiteBloodCells: '7,500/μL',
        platelets: '250,000/μL',
        glucose: '95 mg/dL',
        cholesterol: '180 mg/dL'
      }
    },
    {
      id: 2,
      title: 'Cardiology Consultation',
      date: '2024-01-08',
      provider: 'Dr. Sarah Johnson',
      type: 'consultation',
      details: {
        complaint: 'Chest pain and shortness of breath',
        examination: 'Normal heart sounds, regular rhythm',
        diagnosis: 'Mild anxiety-related symptoms',
        recommendations: 'Stress management and follow-up in 3 months'
      }
    },
    {
      id: 3,
      title: 'Chest X-Ray',
      date: '2024-01-05',
      provider: 'Radiology Center',
      type: 'imaging',
      details: {
        findings: 'Clear lung fields, normal heart size',
        impression: 'No acute cardiopulmonary abnormalities',
        technique: 'Posterior-anterior and lateral views'
      }
    },
    {
      id: 4,
      title: 'Prescription - Hypertension',
      date: '2024-01-03',
      provider: 'Dr. Ahmed Hassan',
      type: 'prescription',
      details: {
        medication: 'Lisinopril 10mg',
        dosage: 'Once daily',
        duration: '30 days',
        instructions: 'Take with food, monitor blood pressure'
      }
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lab_result': return 'bg-blue-100 text-blue-800';
      case 'consultation': return 'bg-green-100 text-green-800';
      case 'imaging': return 'bg-purple-100 text-purple-800';
      case 'prescription': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleView = (record: any) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
    toast({
      title: 'Opening Record',
      description: `Viewing ${record.title}`,
    });
  };

  const handleDownload = (record: any) => {
    console.log('Downloading record:', record);
    toast({
      title: 'Download Started',
      description: `Downloading ${record.title} as PDF`,
    });
    
    // Create PDF content
    const pdfContent = `
Medical Record: ${record.title}
Date: ${record.date}
Provider: ${record.provider}
Type: ${record.type.replace('_', ' ')}

Details:
${Object.entries(record.details).map(([key, value]) => `${key}: ${value}`).join('\n')}

Generated by SehatyNet+
    `;
    
    const element = document.createElement('a');
    const file = new Blob([pdfContent], {type: 'application/pdf'});
    element.href = URL.createObjectURL(file);
    element.download = `${record.title.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('medicalRecords') || 'Medical Records'}</CardTitle>
          <CardDescription>
            {t('accessRecords') || 'Access your medical history and documents'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {records.map((record) => (
              <div key={record.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">{record.title}</h3>
                      <p className="text-sm text-gray-600">{record.provider}</p>
                      <p className="text-xs text-gray-500">{record.date}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(record.type)}`}>
                    {record.type.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleView(record)}>
                    <Eye className="h-4 w-4 mr-1" />
                    {t('view') || 'View'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDownload(record)}>
                    <Download className="h-4 w-4 mr-1" />
                    {t('download') || 'Download'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={selectedRecord?.title || ''}
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Date:</span> {selectedRecord.date}
              </div>
              <div>
                <span className="font-medium">Provider:</span> {selectedRecord.provider}
              </div>
              <div>
                <span className="font-medium">Type:</span> {selectedRecord.type.replace('_', ' ')}
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Details:</h4>
              <div className="space-y-2">
                {Object.entries(selectedRecord.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    <span>{value as string}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button onClick={() => handleDownload(selectedRecord)}>
                <Download className="h-4 w-4 mr-1" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={closeModal}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default MedicalRecords;
