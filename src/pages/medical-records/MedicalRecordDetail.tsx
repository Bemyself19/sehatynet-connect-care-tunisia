import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

function humanize(key: string) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, ' ');
}

const MedicalRecordDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api.getMedicalRecord(id)
      .then(setRecord)
      .catch(() => setError('Failed to load medical record'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!record) return <div className="p-8">No record found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Medical Record Details</h1>
      {/* General Info */}
      <div className="space-y-1">
        <div><span className="font-semibold">Date:</span> {new Date(record.date).toLocaleString()}</div>
        <div><span className="font-semibold">Type:</span> {humanize(record.type)}</div>
        <div><span className="font-semibold">Title:</span> {record.title}</div>
      </div>
      {/* Provider */}
      {record.providerId && (
        <div>
          <div className="font-semibold mb-1">Provider:</div>
          <div>{record.providerId.firstName} {record.providerId.lastName}{record.providerId.specialization ? ` (${record.providerId.specialization})` : ''}</div>
        </div>
      )}
      {/* Tags */}
      {record.tags && record.tags.length > 0 && (
        <div>
          <div className="font-semibold mb-1">Tags:</div>
          <div className="flex flex-wrap gap-2">
            {record.tags.map((tag: string) => (
              <span key={tag} className="bg-gray-200 rounded px-2 py-0.5 text-xs">{tag}</span>
            ))}
          </div>
        </div>
      )}
      {/* Details */}
      <div>
        <div className="font-semibold mb-1">Details:</div>
        {record.details && typeof record.details === 'object' && !Array.isArray(record.details) ? (
          <>
            {/* Medications */}
            {Array.isArray(record.details.medications) && record.details.medications.length > 0 && (
              <div className="mb-4">
                <div className="font-semibold mb-1">Medications</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-2 py-1 text-left">Medication</th>
                        <th className="px-2 py-1 text-left">Dosage</th>
                        <th className="px-2 py-1 text-left">Frequency</th>
                        <th className="px-2 py-1 text-left">Duration</th>
                        <th className="px-2 py-1 text-left">Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {record.details.medications.map((med: any, idx: number) => (
                        <tr key={idx} className="border-t">
                          <td className="px-2 py-1">{med.name}</td>
                          <td className="px-2 py-1">{med.dosage}</td>
                          <td className="px-2 py-1">{med.frequency}</td>
                          <td className="px-2 py-1">{med.duration}</td>
                          <td className="px-2 py-1">{med.instructions || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Lab Tests */}
            {Array.isArray(record.details.labTests) && record.details.labTests.length > 0 && (
              <div className="mb-4">
                <div className="font-semibold mb-1">Lab Tests</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-2 py-1 text-left">Test Name</th>
                        <th className="px-2 py-1 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {record.details.labTests.map((test: any, idx: number) => (
                        <tr key={idx} className="border-t">
                          <td className="px-2 py-1">{test.testName}</td>
                          <td className="px-2 py-1">{test.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Radiology Exams */}
            {Array.isArray(record.details.radiology) && record.details.radiology.length > 0 && (
              <div className="mb-4">
                <div className="font-semibold mb-1">Radiology Exams</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-2 py-1 text-left">Exam Name</th>
                        <th className="px-2 py-1 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {record.details.radiology.map((exam: any, idx: number) => (
                        <tr key={idx} className="border-t">
                          <td className="px-2 py-1">{exam.examName}</td>
                          <td className="px-2 py-1">{exam.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Fallback for other details */}
            {(!record.details.medications && !record.details.labTests && !record.details.radiology) && (
              <div className="bg-gray-50 p-3 rounded border text-sm space-y-2">
                {Object.entries(record.details).map(([key, value]) => (
                  <div key={key} className="flex">
                    <span className="w-1/3 font-medium text-gray-700">{humanize(key)}:</span>
                    <span className="w-2/3 text-gray-900">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="bg-gray-50 p-3 rounded border text-sm">{String(record.details)}</div>
        )}
      </div>
      <Button asChild variant="outline">
        <Link to={record.appointmentId ? `/live-consultation/${record.appointmentId._id || record.appointmentId}` : "/dashboard/doctor"}>
          Back to Live Consultation
        </Link>
      </Button>
    </div>
  );
};

export default MedicalRecordDetail; 