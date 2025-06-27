import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Scan, Plus, Search } from 'lucide-react';

const RadiologistStudies: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Imaging Studies</h1>
        <p className="text-gray-600">Manage radiological imaging studies and procedures</p>
      </div>

      {/* Studies Content */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="h-5 w-5 text-blue-600" />
                <span>Imaging Studies Management</span>
              </CardTitle>
              <CardDescription>
                Manage available imaging studies and procedures
              </CardDescription>
            </div>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Add Study</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Scan className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Imaging Studies Management</h3>
            <p className="text-gray-500 mb-4">
              This section will contain detailed imaging studies management features.
            </p>
            <div className="flex justify-center space-x-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <Scan className="h-3 w-3 mr-1" />
                Available Studies: 89
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <Monitor className="h-3 w-3 mr-1" />
                Active Procedures: 76
              </Badge>
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                <Search className="h-3 w-3 mr-1" />
                Modalities: 8
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RadiologistStudies; 