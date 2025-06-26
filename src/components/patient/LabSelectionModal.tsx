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

interface LabSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLab: (lab: Provider) => void;
}

const LabSelectionModal: React.FC<LabSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectLab
}) => {
  const [labs, setLabs] = useState<Provider[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      const fetchLabs = async () => {
        try {
          setIsLoading(true);
          const providers = await api.getProviders({ role: 'lab' });
          setLabs(providers);
          setError(null);
        } catch (err) {
          setError('Failed to fetch labs. Please try again.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchLabs();
    }
  }, [isOpen]);

  const filteredLabs = labs.filter(lab => {
    const matchesSearch = !searchQuery || `${lab.firstName} ${lab.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select a Lab">
      <div className="space-y-4">
        <Input
          placeholder="Search labs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {isLoading ? (
          <div className="text-center">Loading labs...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : filteredLabs.length > 0 ? (
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLabs.map(lab => (
                <Card key={lab._id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/profile/lab/${lab._id}`)}>
                  <CardHeader>
                    <CardTitle className="text-base">{lab.firstName} {lab.lastName}</CardTitle>
                    <CardDescription>Lab</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{lab.address}</p>
                    <p className="text-sm text-gray-500">{lab.phone}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No labs found matching your criteria.
          </div>
        )}
      </div>
    </Modal>
  );
};

export default LabSelectionModal; 