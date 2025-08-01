import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';

interface MedicalProfileQAModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { allergies: string[]; medications: string[]; conditions: string[] }) => void;
}

export const MedicalProfileQAModal: React.FC<MedicalProfileQAModalProps> = ({ open, onClose, onSave }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});

  const questions = [
    {
      key: 'allergies',
      label: t('allergiesQuestion') || 'Do you have any known allergies?',
      placeholder: t('allergiesPlaceholder') || 'List allergies separated by commas (e.g. penicillin, peanuts)'
    },
    {
      key: 'medications',
      label: t('medicationsQuestion') || 'Are you currently taking any medications?',
      placeholder: t('medicationsPlaceholder') || 'List medications separated by commas (e.g. aspirin, insulin)'
    },
    {
      key: 'conditions',
      label: t('conditionsQuestion') || 'Do you have any chronic medical conditions or past major illnesses?',
      placeholder: t('conditionsPlaceholder') || 'List conditions separated by commas (e.g. diabetes, asthma, hypertension)'
    }
  ];

  React.useEffect(() => {
    if (!open) {
      setStep(0);
      setAnswers({});
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setAnswers((prev) => ({ ...prev, [questions[step].key]: e.target.value }));
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Save all answers and close modal
      onSave({
        allergies: answers.allergies ? answers.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        medications: answers.medications ? answers.medications.split(',').map(s => s.trim()).filter(Boolean) : [],
        conditions: answers.conditions ? answers.conditions.split(',').map(s => s.trim()).filter(Boolean) : [],
      });
      // Modal will close via parent onSave handler
    }
  };

  const handleSkip = async () => {
    await api.setMedicalInfoDismissed(true);
    onClose();
    // Reset handled by useEffect
  };

  const isLastStep = step === questions.length - 1;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('medicalInformation') || 'Medical Information'}</DialogTitle>
        </DialogHeader>
        <div className="mb-4 text-gray-700 text-sm">
          {t('medicalInfoDescription') || 'To provide you with the best care, we ask a few questions about your medical background. This information is confidential and helps your healthcare providers understand your needs and keep you safe.'}
        </div>
        <div className="space-y-4">
          <Label htmlFor={questions[step].key}>{questions[step].label}</Label>
          <Textarea
            id={questions[step].key}
            placeholder={questions[step].placeholder}
            value={answers[questions[step].key] || ''}
            onChange={handleChange}
            rows={3}
          />
        </div>
        <DialogFooter className="flex justify-between mt-4">
          <Button variant="ghost" type="button" onClick={handleSkip}>{t('skipForNow') || 'Skip for now'}</Button>
          <Button type="button" onClick={handleNext}>{isLastStep ? t('saveContinue') || 'Save & Continue' : t('next') || 'Next'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 