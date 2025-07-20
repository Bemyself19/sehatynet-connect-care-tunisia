import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Modal from '@/components/ui/modal';
import { Provider } from '@/types/user';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PharmacySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPharmacy: (pharmacy: Provider) => void;
}

const PharmacySelectionModal: React.FC<PharmacySelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectPharmacy
}) => {
  const [pharmacies, setPharmacies] = useState<Provider[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      const fetchPharmacies = async () => {
        try {
          setIsLoading(true);
          const providers = await api.getProviders({ role: 'pharmacy' });
          setPharmacies(providers);
          setError(null);
        } catch (err) {
          setError('Failed to fetch pharmacies. Please try again.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPharmacies();
    }
  }, [isOpen]);

  const filteredPharmacies = pharmacies.filter(pharmacy => {
    const matchesSearch = !searchQuery || `${pharmacy.firstName} ${pharmacy.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select a Pharmacy">
      <div className="space-y-4">
        <Input
          placeholder="Search pharmacies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {isLoading ? (
          <div className="text-center">Loading pharmacies...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : filteredPharmacies.length > 0 ? (
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPharmacies.map(pharmacy => (
                <Card key={pharmacy._id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/profile/pharmacy/${pharmacy._id}`)}>
                  <CardHeader>
                    <CardTitle className="text-base">{pharmacy.firstName} {pharmacy.lastName}</CardTitle>
                    <CardDescription>Pharmacy</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{pharmacy.address}</p>
                    <p className="text-sm text-gray-500">{pharmacy.phone}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No pharmacies found matching your criteria.
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PharmacySelectionModal; 