import React from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard } from 'lucide-react';

interface FlouciPaymentOptionProps {
  isSelected: boolean;
  onSelect: () => void;
}

const FlouciPaymentOption: React.FC<FlouciPaymentOptionProps> = ({ isSelected, onSelect }) => {
  const { t } = useTranslation();

  return (
    <div 
      className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer ${
        isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
      }`}
      onClick={onSelect}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <CreditCard className="h-5 w-5 text-primary" />
      </div>
      <div className="grid gap-1">
        <h3 className="font-medium">
          {t('flouci') || 'Flouci'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('flouciDescription') || 'Pay easily with your debit or credit card via Flouci'}
        </p>
      </div>
    </div>
  );
};

export default FlouciPaymentOption;
