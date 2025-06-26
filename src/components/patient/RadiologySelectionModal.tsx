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

interface RadiologySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRadiologist: (radiologist: Provider) => void;
}

const RadiologySelectionModal: React.FC<RadiologySelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectRadiologist
}) => {
  const [radiologists, setRadiologists] = useState<Provider[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      const fetchRadiologists = async () => {
        try {
          setIsLoading(true);
          const providers = await api.getProviders({ role: 'radiologist' });
          setRadiologists(providers);
          setError(null);
        } catch (err) {
          setError('Failed to fetch radiologists. Please try again.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchRadiologists();
    }
  }, [isOpen]);

  const filteredRadiologists = radiologists.filter(radiologist => {
    const matchesSearch = !searchQuery || `${radiologist.firstName} ${radiologist.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select a Radiologist">
      <div className="space-y-4">
        <Input
          placeholder="Search radiologists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {isLoading ? (
          <div className="text-center">Loading radiologists...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : filteredRadiologists.length > 0 ? (
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRadiologists.map(radiologist => (
                <Card key={radiologist._id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/profile/radiology/${radiologist._id}`)}>
                  <CardHeader>
                    <CardTitle className="text-base">{radiologist.firstName} {radiologist.lastName}</CardTitle>
                    <CardDescription>Radiology</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{radiologist.address}</p>
                    <p className="text-sm text-gray-500">{radiologist.phone}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center text-gray-500 py-8">
            No radiologists found matching your criteria.
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RadiologySelectionModal; 