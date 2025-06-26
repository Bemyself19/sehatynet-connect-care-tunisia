import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useUser } from '@/hooks/useUser';

interface TeleExpertiseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TeleExpertiseModal: React.FC<TeleExpertiseModalProps> = ({ isOpen, onClose }) => {
  const { user } = useUser();
  const [reason, setReason] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);
  const [specialtyError, setSpecialtyError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [doctorError, setDoctorError] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoadingSpecialties(true);
      api.getSpecialties()
        .then((data) => {
          setSpecialties(data.map((s: any) => s.name));
          setSpecialtyError(null);
        })
        .catch(() => setSpecialtyError('Failed to load specialties'))
        .finally(() => setLoadingSpecialties(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (specialty) {
      setLoadingDoctors(true);
      api.getProviders({ specialization: specialty, role: 'doctor', isActive: true })
        .then((data) => {
          setDoctors(data);
          setDoctorError(null);
        })
        .catch(() => setDoctorError('Failed to load doctors'))
        .finally(() => setLoadingDoctors(false));
    } else {
      setDoctors([]);
      setSelectedDoctor('');
    }
  }, [specialty]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !specialty || !selectedDoctor) {
      toast.error('Missing Information', {
        description: 'Please fill out all required fields.',
      });
      return;
    }
    if (!user) {
      toast.error('Not authenticated');
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Create the tele-expertise request
      const request = await api.createTeleExpertiseRequest({
        patientId: user._id,
        doctorId: selectedDoctor,
        specialty,
        details: reason,
      });
      // 2. If file is selected, upload it
      if (file) {
        await api.uploadTeleExpertisePatientFile(request._id, file);
        toast.success('Request and file submitted', {
          description: 'Your tele-expertise request and document have been sent successfully.',
        });
      } else {
        toast.success('Request Submitted', {
          description: 'Your tele-expertise request has been sent successfully.',
        });
      }
      onClose();
      setReason('');
      setSpecialty('');
      setFile(null);
      setSelectedDoctor('');
    } catch (error) {
      toast.error('Submission Failed', {
        description: 'There was an error submitting your request. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Request Tele-expertise</DialogTitle>
          <DialogDescription>
            Submit a request for a second opinion or expert consultation from a specialist.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="specialty" className="text-right">
                Specialty
              </Label>
              <div className="col-span-3">
                {loadingSpecialties ? (
                  <div>Loading specialties...</div>
                ) : specialtyError ? (
                  <div className="text-red-500">{specialtyError}</div>
                ) : (
                  <Select value={specialty} onValueChange={setSpecialty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a required specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map(spec => (
                        <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            {specialty && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="doctor" className="text-right">
                  Doctor
                </Label>
                <div className="col-span-3">
                  {loadingDoctors ? (
                    <div>Loading doctors...</div>
                  ) : doctorError ? (
                    <div className="text-red-500">{doctorError}</div>
                  ) : (
                    <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.length === 0 ? (
                          <div className="px-4 py-2 text-gray-500">No doctors found for this specialty.</div>
                        ) : (
                          doctors.map(doc => (
                            <SelectItem key={doc._id} value={doc._id}>
                              {doc.firstName} {doc.lastName} ({doc.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Reason
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe the reason for your request."
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="file-upload" className="text-right">
                Documents
              </Label>
              <Input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeleExpertiseModal; 