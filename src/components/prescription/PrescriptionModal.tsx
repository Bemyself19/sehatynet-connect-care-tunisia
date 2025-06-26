import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Prescription, Medication } from '@/types/prescription';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface PrescriptionModalProps {
  open: boolean;
  onClose: () => void;
  appointmentId: string;
  patientId: string;
  patientName: string;
  onPrescriptionCreated?: (prescription: Prescription) => void;
}

interface LabTest {
  testName: string;
  notes: string;
}

interface RadiologyExam {
  examName: string;
  notes: string;
}

export function PrescriptionModal({
  open,
  onClose,
  appointmentId,
  patientId,
  patientName,
  onPrescriptionCreated
}: PrescriptionModalProps) {
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [radiology, setRadiology] = useState<RadiologyExam[]>([]);
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<boolean>(false);

  const { mutate: createPrescription, isPending } = useMutation({
    mutationFn: (prescriptionData: {
      patientId: string;
      appointmentId: string;
      medications: Medication[];
      labTests: LabTest[];
      radiology: RadiologyExam[];
      notes: string;
    }) => api.createPrescription(prescriptionData),
    onSuccess: (data) => {
      toast.success('Prescription created successfully');
      
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['medical-records'] });

      if (onPrescriptionCreated) {
        onPrescriptionCreated(data);
      }
      onClose();
    },
    onError: (error: any) => {
      console.error('Error creating prescription:', error);
      toast.error(error.message || 'Failed to create prescription');
    },
  });

  useEffect(() => {
    if (!open) {
      setMedications([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
      setLabTests([]);
      setRadiology([]);
      setNotes('');
    }
  }, [open]);

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updatedMedications = [...medications];
    updatedMedications[index] = { ...updatedMedications[index], [field]: value };
    setMedications(updatedMedications);
  };

  const addLabTest = () => setLabTests([...labTests, { testName: '', notes: '' }]);
  const removeLabTest = (index: number) => setLabTests(labTests.filter((_, i) => i !== index));
  const updateLabTest = (index: number, field: keyof LabTest, value: string) => {
    const updated = [...labTests];
    updated[index] = { ...updated[index], [field]: value };
    setLabTests(updated);
  };

  const addRadiology = () => setRadiology([...radiology, { examName: '', notes: '' }]);
  const removeRadiology = (index: number) => setRadiology(radiology.filter((_, i) => i !== index));
  const updateRadiology = (index: number, field: keyof RadiologyExam, value: string) => {
    const updated = [...radiology];
    updated[index] = { ...updated[index], [field]: value };
    setRadiology(updated);
  };

  const handleSubmit = () => {
    const validMedications = medications.filter(med => 
      med.name.trim() && med.dosage.trim() && med.frequency.trim() && med.duration.trim()
    );
    const validLabTests = labTests.filter(test => test.testName.trim());
    const validRadiology = radiology.filter(exam => exam.examName.trim());

    if (
      validMedications.length === 0 &&
      validLabTests.length === 0 &&
      validRadiology.length === 0
    ) {
      toast.error('Please add at least one medication, lab test, or radiology exam');
      return;
    }

    createPrescription({
      patientId,
      appointmentId,
      medications: validMedications,
      labTests: validLabTests,
      radiology: validRadiology,
      notes
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Prescription</DialogTitle>
          <DialogDescription>
            Create a prescription for {patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Medications</CardTitle>
              <CardDescription>
                Add medications to the prescription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {medications.map((medication, index) => (
                <div key={index} className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor={`med-name-${index}`}>Medication Name *</Label>
                    <Input
                      id={`med-name-${index}`}
                      value={medication.name}
                      onChange={(e) => updateMedication(index, 'name', e.target.value)}
                      placeholder="e.g., Amoxicillin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`med-dosage-${index}`}>Dosage *</Label>
                    <Input
                      id={`med-dosage-${index}`}
                      value={medication.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                      placeholder="e.g., 500mg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`med-frequency-${index}`}>Frequency *</Label>
                    <Input
                      id={`med-frequency-${index}`}
                      value={medication.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      placeholder="e.g., Twice daily"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`med-duration-${index}`}>Duration *</Label>
                    <Input
                      id={`med-duration-${index}`}
                      value={medication.duration}
                      onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                      placeholder="e.g., 7 days"
                    />
                  </div>
                  {medications.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMedication(index)}
                      className="col-span-2 w-fit"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addMedication}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Medication
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lab Tests</CardTitle>
              <CardDescription>
                Add lab tests to the prescription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {labTests.map((test, index) => (
                <div key={index} className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor={`lab-test-name-${index}`}>Test Name *</Label>
                    <Input
                      id={`lab-test-name-${index}`}
                      value={test.testName}
                      onChange={(e) => updateLabTest(index, 'testName', e.target.value)}
                      placeholder="e.g., CBC, Blood Glucose"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`lab-test-notes-${index}`}>Notes</Label>
                    <Input
                      id={`lab-test-notes-${index}`}
                      value={test.notes}
                      onChange={(e) => updateLabTest(index, 'notes', e.target.value)}
                      placeholder="Special instructions, if any"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLabTest(index)}
                    className="col-span-2 w-fit"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addLabTest}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Lab Test
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Radiology</CardTitle>
              <CardDescription>
                Add radiology exams to the prescription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {radiology.map((exam, index) => (
                <div key={index} className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor={`radiology-exam-name-${index}`}>Exam Name *</Label>
                    <Input
                      id={`radiology-exam-name-${index}`}
                      value={exam.examName}
                      onChange={(e) => updateRadiology(index, 'examName', e.target.value)}
                      placeholder="e.g., Chest X-ray, MRI Brain"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`radiology-notes-${index}`}>Notes</Label>
                    <Input
                      id={`radiology-notes-${index}`}
                      value={exam.notes}
                      onChange={(e) => updateRadiology(index, 'notes', e.target.value)}
                      placeholder="Special instructions, if any"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRadiology(index)}
                    className="col-span-2 w-fit"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addRadiology}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Radiology Exam
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Notes</CardTitle>
              <CardDescription>
                Add any additional instructions or notes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any additional instructions, side effects to watch for, or other notes..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="mt-6">
          <Button type="button" onClick={handleSubmit} disabled={isPending || loading} className="w-full">
            {isPending || loading ? 'Saving...' : 'Save Prescription'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
