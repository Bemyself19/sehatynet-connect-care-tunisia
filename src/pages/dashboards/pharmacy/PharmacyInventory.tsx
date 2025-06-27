import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Package, AlertTriangle, TrendingUp } from 'lucide-react';

const PharmacyInventory: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory</h1>
        <p className="text-gray-600">Manage pharmacy inventory and stock levels</p>
      </div>

      {/* Inventory Content */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            <span>Inventory Management</span>
          </CardTitle>
          <CardDescription>
            Monitor stock levels and manage inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Inventory Management</h3>
            <p className="text-gray-500 mb-4">
              This section will contain detailed inventory management features.
            </p>
            <div className="flex justify-center space-x-4">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <TrendingUp className="h-3 w-3 mr-1" />
                In Stock: 1,234
              </Badge>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Low Stock: 23
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700">
                <Package className="h-3 w-3 mr-1" />
                Out of Stock: 5
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PharmacyInventory; 