import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Search, CalendarX } from 'lucide-react';
import { format, parseISO, isSameWeek, isSameMonth, isSameDay, startOfWeek, addDays, startOfMonth, endOfMonth, getDay, addMonths, subMonths, isToday } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  scheduled: 'bg-blue-100 text-blue-700 border-blue-300',
  completed: 'bg-green-100 text-green-700 border-green-300',
  cancelled: 'bg-red-100 text-red-700 border-red-300',
};

const DoctorTeleExpertise: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [view, setView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        const data = await api.getTeleExpertiseRequests();
        setRequests(data);
      } catch (error) {
        setRequests([]);
      }
      setLoading(false);
    };
    fetchRequests();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  const filteredRequests = useMemo(() => {
    if (!debouncedSearch) return requests;
    const q = debouncedSearch.toLowerCase().trim();
    const words = q.split(/\s+/).filter(Boolean);
    return requests.filter((r) => {
      if (r.patientId && (r.patientId.firstName || r.patientId.lastName)) {
        const first = (r.patientId.firstName || '').toLowerCase();
        const last = (r.patientId.lastName || '').toLowerCase();
        return words.some(word => first.includes(word) || last.includes(word));
      }
      const fallback = (r.patientName || r.patient?.name || '').toLowerCase();
      return words.some(word => fallback.includes(word));
    });
  }, [requests, debouncedSearch]);

  // Week grid
  const weekGrid = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(start, i);
      return {
        date: day,
        requests: filteredRequests.filter(r => isSameDay(parseISO(r.date || r.createdAt), day)),
      };
    });
  }, [filteredRequests, currentDate]);

  // Month grid
  const monthGrid = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const daysInMonth = end.getDate();
    const firstDayOfWeek = getDay(start);
    const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;
    const grid = [];
    for (let i = 0; i < totalCells; i++) {
      const day = addDays(start, i - firstDayOfWeek);
      grid.push({
        date: day,
        inMonth: day >= start && day <= end,
        requests: filteredRequests.filter(r => isSameDay(parseISO(r.date || r.createdAt), day)),
      });
    }
    return grid;
  }, [filteredRequests, currentDate]);

  const getPatientName = (req: any) =>
    (req.patientId && (req.patientId.firstName || req.patientId.lastName))
      ? `${req.patientId.firstName || ''} ${req.patientId.lastName || ''}`.trim()
      : req.patientName || req.patient?.name || 'Unknown Patient';

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Tele-Expertise</h2>
      <div className="mb-6 flex items-center gap-2 max-w-md relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={18} />
        </span>
        <Input
          type="text"
          placeholder="Search by patient name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search tele-expertise requests"
          className="pl-10 pr-8 py-2 rounded shadow-sm focus:ring-2 focus:ring-purple-500"
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setSearch('')}
            aria-label="Clear search"
            tabIndex={0}
          >
            ×
          </button>
        )}
      </div>
      {/* Calendar View Switcher and Navigation */}
      <div className="flex gap-2 mb-4 items-center">
        <button className={`px-3 py-1 rounded ${view === 'week' ? 'bg-purple-500 text-white' : 'bg-slate-100 text-gray-700'}`} onClick={() => setView('week')}>Week</button>
        <button className={`px-3 py-1 rounded ${view === 'month' ? 'bg-purple-500 text-white' : 'bg-slate-100 text-gray-700'}`} onClick={() => setView('month')}>Month</button>
        <button className="ml-4 px-2" onClick={() => setCurrentDate(view === 'week' ? addDays(currentDate, -7) : subMonths(currentDate, 1))}>&lt;</button>
        <span className="font-semibold">{format(currentDate, view === 'week' ? 'MMM d, yyyy' : 'MMMM yyyy')}</span>
        <button className="px-2" onClick={() => setCurrentDate(view === 'week' ? addDays(currentDate, 7) : addMonths(currentDate, 1))}>&gt;</button>
      </div>
      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow p-4 mb-8 overflow-x-auto">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((wd) => (
            <div key={wd} className="text-xs font-semibold text-center text-gray-500">{wd}</div>
          ))}
        </div>
        {view === 'week' ? (
          <div className="grid grid-cols-7 gap-2">
            {weekGrid.map((cell, idx) => (
              <div
                key={idx}
                className={`min-h-[90px] rounded-xl shadow-sm border transition-all p-2 flex flex-col items-center relative group cursor-pointer ${isToday(cell.date) ? 'border-purple-500 ring-2 ring-purple-200' : 'border-slate-200 bg-slate-50 hover:bg-purple-50'}`}
                aria-label={`Requests for ${format(cell.date, 'EEEE, MMM d')}`}
              >
                <div className={`text-xs font-bold text-gray-700 text-center mb-1 ${isToday(cell.date) ? 'text-purple-700' : ''}`}>{format(cell.date, 'd')}</div>
                {cell.requests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-xs text-gray-300 mt-2">
                    <CalendarX className="w-5 h-5 mb-1" />
                    No requests
                  </div>
                ) : (
                  cell.requests.map((req: any) => (
                    <button
                      key={req._id}
                      className={`w-full mt-1 px-2 py-1 rounded-full border text-xs font-medium truncate transition-all ${statusColors[req.status]} hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-400`}
                      onClick={() => setSelectedRequest(req)}
                      aria-label={`View request for ${getPatientName(req)}`}
                      title={`${getPatientName(req)} (${req.status})`}
                    >
                      {getPatientName(req)}
                    </button>
                  ))
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {monthGrid.map((cell, idx) => (
              <div
                key={idx}
                className={`min-h-[90px] rounded-xl shadow-sm border transition-all p-2 flex flex-col items-center relative group cursor-pointer ${cell.inMonth ? (isToday(cell.date) ? 'border-purple-500 ring-2 ring-purple-200' : 'border-slate-200 bg-slate-50 hover:bg-purple-50') : 'bg-slate-100 border-slate-100 opacity-60'}`}
                aria-label={`Requests for ${format(cell.date, 'EEEE, MMM d')}`}
              >
                <div className={`text-xs font-bold text-gray-700 text-center mb-1 ${isToday(cell.date) ? 'text-purple-700' : ''}`}>{format(cell.date, 'd')}</div>
                {cell.requests.length === 0 ? null : (
                  cell.requests.map((req: any) => (
                    <button
                      key={req._id}
                      className={`w-full mt-1 px-2 py-1 rounded-full border text-xs font-medium truncate transition-all ${statusColors[req.status]} hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-400`}
                      onClick={() => setSelectedRequest(req)}
                      aria-label={`View request for ${getPatientName(req)}`}
                      title={`${getPatientName(req)} (${req.status})`}
                    >
                      {getPatientName(req)}
                    </button>
                  ))
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Request Detail Modal (placeholder) */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-[95vw] w-full md:w-[420px]">
            <h3 className="text-lg font-bold mb-4">Tele-Expertise Request Details</h3>
            <div className="space-y-2 text-sm">
              <div><b>Patient:</b> {getPatientName(selectedRequest)}</div>
              <div><b>Doctor:</b> {selectedRequest.doctorId?.firstName || ''} {selectedRequest.doctorId?.lastName || ''}</div>
              <div><b>Specialty:</b> {selectedRequest.specialty}</div>
              <div><b>Status:</b> {selectedRequest.status}</div>
              <div><b>Details:</b> {selectedRequest.details || <span className="italic text-gray-400">No details provided</span>}</div>
              {selectedRequest.response && (
                <div><b>Response:</b> {selectedRequest.response}</div>
              )}
              {selectedRequest.reportUrl && (
                <div><b>Report File:</b> <a href={selectedRequest.reportUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Report</a></div>
              )}
              {selectedRequest.patientFileUrl && (
                <div><b>Patient File:</b> <a href={selectedRequest.patientFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View File</a></div>
              )}
              <div><b>Created:</b> {selectedRequest.createdAt ? format(parseISO(selectedRequest.createdAt), 'yyyy-MM-dd HH:mm') : '-'}</div>
              <div><b>Last Updated:</b> {selectedRequest.updatedAt ? format(parseISO(selectedRequest.updatedAt), 'yyyy-MM-dd HH:mm') : '-'}</div>
            </div>
            <button className="mt-6 px-4 py-2 bg-purple-500 text-white rounded w-full" onClick={() => setSelectedRequest(null)}>Close</button>
          </div>
        </div>
      )}
      {/* List/Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredRequests
          .slice() // copy array
          .sort((a, b) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime())
          .slice(0, 6)
          .map((req) => (
            <Card key={req._id} className="mb-4">
              <CardHeader>
                <CardTitle>{req.title || 'Tele-Expertise Request'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div><b>Patient:</b> {getPatientName(req)}</div>
                <div><b>Doctor:</b> {req.doctorId?.firstName || ''} {req.doctorId?.lastName || ''}</div>
                <div><b>Specialty:</b> {req.specialty}</div>
                <div><b>Status:</b> {req.status}</div>
                <div><b>Details:</b> {req.details || <span className="italic text-gray-400">No details provided</span>}</div>
                {req.response && (
                  <div><b>Response:</b> {req.response}</div>
                )}
                {req.reportUrl && (
                  <div><b>Report File:</b> <a href={req.reportUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Report</a></div>
                )}
                {req.patientFileUrl && (
                  <div><b>Patient File:</b> <a href={req.patientFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View File</a></div>
                )}
                <div><b>Created:</b> {req.createdAt ? format(parseISO(req.createdAt), 'yyyy-MM-dd HH:mm') : '-'}</div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default DoctorTeleExpertise; 