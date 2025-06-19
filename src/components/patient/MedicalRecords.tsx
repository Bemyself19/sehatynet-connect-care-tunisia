
import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MedicalRecords: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const records = [
    {
      id: 1,
      title: 'Blood Test Results',
      date: '2024-01-10',
      provider: 'Central Lab',
      type: 'lab_result'
    },
    {
      id: 2,
      title: 'Cardiology Consultation',
      date: '2024-01-08',
      provider: 'Dr. Sarah Johnson',
      type: 'consultation'
    },
    {
      id: 3,
      title: 'Chest X-Ray',
      date: '2024-01-05',
      provider: 'Radiology Center',
      type: 'imaging'
    },
    {
      id: 4,
      title: 'Prescription - Hypertension',
      date: '2024-01-03',
      provider: 'Dr. Ahmed Hassan',
      type: 'prescription'
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
    console.log('Viewing record:', record);
    toast({
      title: 'Opening Record',
      description: `Viewing ${record.title}`,
    });
    // In a real app, this would open a modal or navigate to a detailed view
  };

  const handleDownload = (record: any) => {
    console.log('Downloading record:', record);
    toast({
      title: 'Download Started',
      description: `Downloading ${record.title}`,
    });
    // In a real app, this would trigger a file download
    // For demo purposes, we'll create a mock download
    const element = document.createElement('a');
    const file = new Blob([`Medical Record: ${record.title}\nDate: ${record.date}\nProvider: ${record.provider}`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${record.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
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
  );
};

export default MedicalRecords;
