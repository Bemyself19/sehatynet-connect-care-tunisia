import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Pill, 
  AlertTriangle, 
  Syringe, 
  Plus, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Calendar,
  User,
  Activity
} from 'lucide-react';
import api from '@/lib/api';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { 
  LabResult, 
  CreateLabResultData,
  LabTest 
} from '@/types/labResult';
import { 
  MedicationHistory, 
  CreateMedicationHistoryData,
  MedicationDosage 
} from '@/types/medication';
import { 
  Allergy, 
  CreateAllergyData,
  AllergyReaction 
} from '@/types/allergy';
import { 
  Immunization, 
  CreateImmunizationData,
  ImmunizationDose 
} from '@/types/immunization';

interface EnhancedMedicalRecordsProps {
  patientId?: string;
  className?: string;
}

const EnhancedMedicalRecords: React.FC<EnhancedMedicalRecordsProps> = ({ 
  patientId, 
  className 
}) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('lab-results');
  
  // State for all data types
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [medications, setMedications] = useState<MedicationHistory[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [immunizations, setImmunizations] = useState<Immunization[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState({
    labResults: false,
    medications: false,
    allergies: false,
    immunizations: false
  });

  // Modal states
  const [showLabResultModal, setShowLabResultModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showImmunizationModal, setShowImmunizationModal] = useState(false);

  // Form states
  const [labResultForm, setLabResultForm] = useState<Partial<CreateLabResultData>>({
    labName: '',
    orderDate: new Date().toISOString().split('T')[0],
    tests: []
  });

  const [medicationForm, setMedicationForm] = useState<Partial<CreateMedicationHistoryData>>({
    medicationName: '',
    medicationType: 'prescription',
    dosage: {
      amount: 0,
      unit: 'mg',
      frequency: 'daily'
    },
    startDate: new Date().toISOString().split('T')[0],
    status: 'active'
  });

  const [allergyForm, setAllergyForm] = useState<Partial<CreateAllergyData>>({
    allergenName: '',
    allergenType: 'medication',
    reactions: [],
    status: 'active'
  });

  const [immunizationForm, setImmunizationForm] = useState<Partial<CreateImmunizationData>>({
    vaccineName: '',
    category: 'routine',
    doses: [],
    totalDosesRequired: 1,
    isRequired: true
  });

  const currentPatientId = patientId || user?._id;

  // Load data based on active tab
  useEffect(() => {
    if (!currentPatientId) return;
    
    switch (activeTab) {
      case 'lab-results':
        loadLabResults();
        break;
      case 'medications':
        loadMedications();
        break;
      case 'allergies':
        loadAllergies();
        break;
      case 'immunizations':
        loadImmunizations();
        break;
    }
  }, [activeTab, currentPatientId]);

  const loadLabResults = async () => {
    if (!currentPatientId) return;
    setLoading(prev => ({ ...prev, labResults: true }));
    try {
      const results = await api.getLabResultsByPatient(currentPatientId);
      setLabResults(results);
    } catch (error) {
      toast.error('Failed to load lab results');
    } finally {
      setLoading(prev => ({ ...prev, labResults: false }));
    }
  };

  const loadMedications = async () => {
    if (!currentPatientId) return;
    setLoading(prev => ({ ...prev, medications: true }));
    try {
      const meds = await api.getMedicationHistory({ patientId: currentPatientId });
      setMedications(meds);
    } catch (error) {
      toast.error('Failed to load medications');
    } finally {
      setLoading(prev => ({ ...prev, medications: false }));
    }
  };

  const loadAllergies = async () => {
    if (!currentPatientId) return;
    setLoading(prev => ({ ...prev, allergies: true }));
    try {
      const allergyList = await api.getAllergies({ patientId: currentPatientId });
      setAllergies(allergyList);
    } catch (error) {
      toast.error('Failed to load allergies');
    } finally {
      setLoading(prev => ({ ...prev, allergies: false }));
    }
  };

  const loadImmunizations = async () => {
    if (!currentPatientId) return;
    setLoading(prev => ({ ...prev, immunizations: true }));
    try {
      const immList = await api.getImmunizations({ patientId: currentPatientId });
      setImmunizations(immList);
    } catch (error) {
      toast.error('Failed to load immunizations');
    } finally {
      setLoading(prev => ({ ...prev, immunizations: false }));
    }
  };

  // Form handlers
  const handleCreateLabResult = async () => {
    if (!currentPatientId) return;
    try {
      await api.createLabResult({
        ...labResultForm,
        patientId: currentPatientId,
        medicalRecordId: '', // This would need to be linked to a medical record
      } as CreateLabResultData);
      toast.success('Lab result created successfully');
      setShowLabResultModal(false);
      loadLabResults();
    } catch (error) {
      toast.error('Failed to create lab result');
    }
  };

  const handleCreateMedication = async () => {
    if (!currentPatientId) return;
    try {
      await api.createMedicationHistory({
        ...medicationForm,
        patientId: currentPatientId,
      } as CreateMedicationHistoryData);
      toast.success('Medication added successfully');
      setShowMedicationModal(false);
      loadMedications();
    } catch (error) {
      toast.error('Failed to add medication');
    }
  };

  const handleCreateAllergy = async () => {
    if (!currentPatientId) return;
    try {
      await api.createAllergy({
        ...allergyForm,
        patientId: currentPatientId,
      } as CreateAllergyData);
      toast.success('Allergy recorded successfully');
      setShowAllergyModal(false);
      loadAllergies();
    } catch (error) {
      toast.error('Failed to record allergy');
    }
  };

  const handleCreateImmunization = async () => {
    if (!currentPatientId) return;
    try {
      await api.createImmunization({
        ...immunizationForm,
        patientId: currentPatientId,
      } as CreateImmunizationData);
      toast.success('Immunization recorded successfully');
      setShowImmunizationModal(false);
      loadImmunizations();
    } catch (error) {
      toast.error('Failed to record immunization');
    }
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
      case 'up_to_date':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'abnormal':
      case 'overdue':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'incomplete':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
      case 'up_to_date':
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'abnormal':
      case 'overdue':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
      case 'high':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
      case 'incomplete':
        return <Activity className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('enhancedMedicalRecords')}
            </span>
            {user?.role === 'doctor' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setShowLabResultModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('addLabResult')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowMedicationModal(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('addMedication')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowAllergyModal(true)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('addAllergy')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowImmunizationModal(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('addImmunization')}
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="lab-results" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('labResults')}
              </TabsTrigger>
              <TabsTrigger value="medications" className="flex items-center gap-2">
                <Pill className="h-4 w-4" />
                {t('medications')}
              </TabsTrigger>
              <TabsTrigger value="allergies" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {t('allergies')}
              </TabsTrigger>
              <TabsTrigger value="immunizations" className="flex items-center gap-2">
                <Syringe className="h-4 w-4" />
                {t('immunizations')}
              </TabsTrigger>
            </TabsList>

            {/* Lab Results Tab */}
            <TabsContent value="lab-results" className="mt-6">
              {loading.labResults ? (
                <div className="text-center py-8">Loading lab results...</div>
              ) : labResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t('noLabResultsFound')}
                </div>
              ) : (
                <div className="space-y-4">
                  {labResults.map((result) => (
                    <Card key={result._id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{result.labName}</h3>
                            <p className="text-sm text-gray-600">
                              {new Date(result.orderDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(result.overallStatus)}>
                            {getStatusIcon(result.overallStatus)}
                            <span className="ml-1">{result.overallStatus}</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Test</TableHead>
                              <TableHead>Value</TableHead>
                              <TableHead>Reference</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {result.tests.map((test, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {test.testName}
                                </TableCell>
                                <TableCell>
                                  {test.value} {test.unit}
                                </TableCell>
                                <TableCell>
                                  {test.referenceRange?.text || 
                                   `${test.referenceRange?.min || ''} - ${test.referenceRange?.max || ''}`}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(test.status)}>
                                    {test.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {result.clinicalNotes && (
                          <div className="mt-4 p-3 bg-gray-50 rounded">
                            <p className="text-sm"><strong>Notes:</strong> {result.clinicalNotes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Medications Tab */}
            <TabsContent value="medications" className="mt-6">
              {loading.medications ? (
                <div className="text-center py-8">Loading medications...</div>
              ) : medications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t('noMedicationsFound')}
                </div>
              ) : (
                <div className="space-y-4">
                  {medications.map((medication) => (
                    <Card key={medication._id} className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{medication.medicationName}</h3>
                            <p className="text-sm text-gray-600">
                              {medication.genericName && `(${medication.genericName})`}
                            </p>
                          </div>
                          <Badge className={getStatusColor(medication.status)}>
                            {medication.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p><strong>Dosage:</strong> {medication.dosage.amount} {medication.dosage.unit}</p>
                            <p><strong>Frequency:</strong> {medication.dosage.frequency}</p>
                            <p><strong>Started:</strong> {new Date(medication.startDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p><strong>Type:</strong> {medication.medicationType}</p>
                            <p><strong>Effectiveness:</strong> {medication.effectiveness}</p>
                            <p><strong>Refills:</strong> {medication.refillCount}</p>
                          </div>
                        </div>
                        {medication.reason && (
                          <div className="mt-3 p-3 bg-blue-50 rounded">
                            <p className="text-sm"><strong>Reason:</strong> {medication.reason}</p>
                          </div>
                        )}
                        {medication.sideEffects.length > 0 && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded">
                            <p className="text-sm"><strong>Side Effects:</strong></p>
                            <ul className="text-sm list-disc list-inside">
                              {medication.sideEffects.map((effect, index) => (
                                <li key={index}>{effect}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Allergies Tab */}
            <TabsContent value="allergies" className="mt-6">
              {loading.allergies ? (
                <div className="text-center py-8">Loading allergies...</div>
              ) : allergies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t('noAllergiesFound')}
                </div>
              ) : (
                <div className="space-y-4">
                  {allergies.map((allergy) => (
                    <Card key={allergy._id} className={`border-l-4 ${allergy.isHighRisk ? 'border-l-red-500' : 'border-l-orange-500'}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{allergy.allergenName}</h3>
                            <p className="text-sm text-gray-600">
                              {allergy.category && `${allergy.category} • `}
                              {allergy.allergenType}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {allergy.isHighRisk && (
                              <Badge className="bg-red-100 text-red-800">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                High Risk
                              </Badge>
                            )}
                            <Badge className={getStatusColor(allergy.status)}>
                              {allergy.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {allergy.reactions.map((reaction, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded">
                              <p className="font-medium">{reaction.reaction}</p>
                              <p className="text-sm text-gray-600">
                                Severity: {reaction.severity}
                                {reaction.onsetTime && ` • Onset: ${reaction.onsetTime}`}
                              </p>
                            </div>
                          ))}
                          {allergy.emergencyInstructions && (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                <strong>Emergency Instructions:</strong> {allergy.emergencyInstructions}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Immunizations Tab */}
            <TabsContent value="immunizations" className="mt-6">
              {loading.immunizations ? (
                <div className="text-center py-8">Loading immunizations...</div>
              ) : immunizations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {t('noImmunizationsFound')}
                </div>
              ) : (
                <div className="space-y-4">
                  {immunizations.map((immunization) => (
                    <Card key={immunization._id} className="border-l-4 border-l-purple-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{immunization.vaccineName}</h3>
                            <p className="text-sm text-gray-600">
                              {immunization.vaccineType && `${immunization.vaccineType} • `}
                              {immunization.category}
                            </p>
                          </div>
                          <Badge className={getStatusColor(immunization.status)}>
                            {getStatusIcon(immunization.status)}
                            <span className="ml-1">{immunization.status}</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p><strong>Doses:</strong> {immunization.doses.length}/{immunization.totalDosesRequired}</p>
                              <p><strong>Required:</strong> {immunization.isRequired ? 'Yes' : 'No'}</p>
                            </div>
                            <div>
                              <p><strong>Next Due:</strong> {immunization.nextDueDate ? new Date(immunization.nextDueDate).toLocaleDateString() : 'N/A'}</p>
                              <p><strong>Source:</strong> {immunization.source}</p>
                            </div>
                          </div>
                          
                          {immunization.doses.length > 0 && (
                            <div>
                              <p className="font-medium mb-2">Doses:</p>
                              <div className="space-y-2">
                                {immunization.doses.map((dose, index) => (
                                  <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                                    <p><strong>Dose {dose.doseNumber}:</strong> {new Date(dose.date).toLocaleDateString()}</p>
                                    {dose.site && <p>Site: {dose.site}</p>}
                                    {dose.route && <p>Route: {dose.route}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {immunization.contraindications.length > 0 && (
                            <div className="p-3 bg-yellow-50 rounded">
                              <p className="text-sm font-medium">Contraindications:</p>
                              <ul className="text-sm list-disc list-inside">
                                {immunization.contraindications.map((contraindication, index) => (
                                  <li key={index}>{contraindication}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Lab Result Modal */}
      <Dialog open={showLabResultModal} onOpenChange={setShowLabResultModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('addLabResult')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="labName">Lab Name</Label>
              <Input
                id="labName"
                value={labResultForm.labName}
                onChange={(e) => setLabResultForm(prev => ({ ...prev, labName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="orderDate">Order Date</Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={labResultForm.orderDate}
                  onChange={(e) => setLabResultForm(prev => ({ ...prev, orderDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="resultDate">Result Date</Label>
                <Input
                  id="resultDate"
                  type="date"
                  value={labResultForm.resultDate}
                  onChange={(e) => setLabResultForm(prev => ({ ...prev, resultDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="clinicalNotes">Clinical Notes</Label>
              <Textarea
                id="clinicalNotes"
                value={labResultForm.clinicalNotes}
                onChange={(e) => setLabResultForm(prev => ({ ...prev, clinicalNotes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowLabResultModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateLabResult}>
                Create Lab Result
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Medication Modal */}
      <Dialog open={showMedicationModal} onOpenChange={setShowMedicationModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('addMedication')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="medicationName">Medication Name</Label>
                <Input
                  id="medicationName"
                  value={medicationForm.medicationName}
                  onChange={(e) => setMedicationForm(prev => ({ ...prev, medicationName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="medicationType">Type</Label>
                <Select
                  value={medicationForm.medicationType}
                  onValueChange={(value) => setMedicationForm(prev => ({ ...prev, medicationType: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prescription">Prescription</SelectItem>
                    <SelectItem value="over_the_counter">Over the Counter</SelectItem>
                    <SelectItem value="supplement">Supplement</SelectItem>
                    <SelectItem value="herbal">Herbal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dosageAmount">Dosage Amount</Label>
                <Input
                  id="dosageAmount"
                  type="number"
                  value={medicationForm.dosage?.amount}
                  onChange={(e) => setMedicationForm(prev => ({ 
                    ...prev, 
                    dosage: { ...prev.dosage!, amount: Number(e.target.value) }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="dosageUnit">Unit</Label>
                <Select
                  value={medicationForm.dosage?.unit}
                  onValueChange={(value) => setMedicationForm(prev => ({ 
                    ...prev, 
                    dosage: { ...prev.dosage!, unit: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mg">mg</SelectItem>
                    <SelectItem value="ml">ml</SelectItem>
                    <SelectItem value="mcg">mcg</SelectItem>
                    <SelectItem value="units">units</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={medicationForm.dosage?.frequency}
                  onValueChange={(value) => setMedicationForm(prev => ({ 
                    ...prev, 
                    dosage: { ...prev.dosage!, frequency: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="twice_daily">Twice Daily</SelectItem>
                    <SelectItem value="three_times_daily">Three Times Daily</SelectItem>
                    <SelectItem value="as_needed">As Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="reason">Reason for Prescription</Label>
              <Textarea
                id="reason"
                value={medicationForm.reason}
                onChange={(e) => setMedicationForm(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMedicationModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateMedication}>
                Add Medication
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Allergy Modal */}
      <Dialog open={showAllergyModal} onOpenChange={setShowAllergyModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('addAllergy')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="allergenName">Allergen Name</Label>
                <Input
                  id="allergenName"
                  value={allergyForm.allergenName}
                  onChange={(e) => setAllergyForm(prev => ({ ...prev, allergenName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="allergenType">Type</Label>
                <Select
                  value={allergyForm.allergenType}
                  onValueChange={(value) => setAllergyForm(prev => ({ ...prev, allergenType: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medication">Medication</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="environmental">Environmental</SelectItem>
                    <SelectItem value="insect">Insect</SelectItem>
                    <SelectItem value="latex">Latex</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={allergyForm.category}
                onChange={(e) => setAllergyForm(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Antibiotics, Nuts, Pollen"
              />
            </div>
            <div>
              <Label htmlFor="emergencyInstructions">Emergency Instructions</Label>
              <Textarea
                id="emergencyInstructions"
                value={allergyForm.emergencyInstructions}
                onChange={(e) => setAllergyForm(prev => ({ ...prev, emergencyInstructions: e.target.value }))}
                placeholder="What to do in case of exposure"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAllergyModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAllergy}>
                Add Allergy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Immunization Modal */}
      <Dialog open={showImmunizationModal} onOpenChange={setShowImmunizationModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('addImmunization')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vaccineName">Vaccine Name</Label>
                <Input
                  id="vaccineName"
                  value={immunizationForm.vaccineName}
                  onChange={(e) => setImmunizationForm(prev => ({ ...prev, vaccineName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="vaccineType">Vaccine Type</Label>
                <Input
                  id="vaccineType"
                  value={immunizationForm.vaccineType}
                  onChange={(e) => setImmunizationForm(prev => ({ ...prev, vaccineType: e.target.value }))}
                  placeholder="e.g., COVID-19, Flu, MMR"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={immunizationForm.category}
                  onValueChange={(value) => setImmunizationForm(prev => ({ ...prev, category: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="occupational">Occupational</SelectItem>
                    <SelectItem value="catch_up">Catch Up</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="totalDoses">Total Doses Required</Label>
                <Input
                  id="totalDoses"
                  type="number"
                  min="1"
                  value={immunizationForm.totalDosesRequired}
                  onChange={(e) => setImmunizationForm(prev => ({ ...prev, totalDosesRequired: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={immunizationForm.notes}
                onChange={(e) => setImmunizationForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowImmunizationModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateImmunization}>
                Add Immunization
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedMedicalRecords; 