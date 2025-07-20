import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Search, CalendarX } from 'lucide-react';
import { format, parseISO, isSameWeek, isSameMonth, isSameDay, startOfWeek, addDays, startOfMonth, endOfMonth, getDay, addMonths, subMonths, isToday } from 'date-fns';
import arTN from '@/lib/date-fns-locale-ar-TN';
import { enUS, fr } from 'date-fns/locale';
import i18n from '@/i18n';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  scheduled: 'bg-blue-100 text-blue-700 border-blue-300',
  completed: 'bg-green-100 text-green-700 border-green-300',
  cancelled: 'bg-red-100 text-red-700 border-red-300',
};

const getDateFnsLocale = (lng: string) => {
  if (lng.toLowerCase().startsWith('ar')) return arTN;
  if (lng.toLowerCase().startsWith('fr')) return fr;
  return enUS;
};

const DoctorTeleExpertise: React.FC = () => {
  const { t, i18n } = useTranslation();
  const locale = getDateFnsLocale(i18n.language);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [view, setView] = useState<'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  // Set week to start on Monday (weekStartsOn: 1)
  const weekDays = [
    t('mon'),
    t('tue'),
    t('wed'),
    t('thu'),
    t('fri'),
    t('sat'),
    t('sun'),
  ];

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
    // Start week on Monday
    const start = startOfWeek(currentDate, { weekStartsOn: 1, locale });
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(start, i);
      return {
        date: day,
        requests: filteredRequests.filter(r => isSameDay(parseISO(r.date || r.createdAt), day)),
      };
    });
  }, [filteredRequests, currentDate, locale]);

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
      : req.patientName || req.patient?.name || t('unknownPatient');

  return (
    <div dir={i18n.language.startsWith('ar') ? 'rtl' : 'ltr'}>
      <h2 className="text-2xl font-bold mb-4">{t('teleExpertise')}</h2>
      <div className="mb-6 flex items-center gap-2 max-w-md relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={18} />
        </span>
        <Input
          type="text"
          placeholder={t('searchByPatientName')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label={t('searchByPatientName')}
          className="pl-10 pr-8 py-2 rounded shadow-sm focus:ring-2 focus:ring-purple-500"
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setSearch('')}
            aria-label={t('clearSearch')}
            tabIndex={0}
          >
            ×
          </button>
        )}
      </div>
      {/* Calendar View Switcher and Navigation */}
      <div className="flex gap-2 mb-4 items-center">
        <button className={`px-3 py-1 rounded ${view === 'week' ? 'bg-purple-500 text-white' : 'bg-slate-100 text-gray-700'}`} onClick={() => setView('week')}>{t('week')}</button>
        <button className={`px-3 py-1 rounded ${view === 'month' ? 'bg-purple-500 text-white' : 'bg-slate-100 text-gray-700'}`} onClick={() => setView('month')}>{t('month')}</button>
        <button className="ml-4 px-2" onClick={() => setCurrentDate(view === 'week' ? addDays(currentDate, -7) : subMonths(currentDate, 1))}>&lt;</button>
        <span className="font-semibold">{
          view === 'week'
            ? format(currentDate, i18n.language.startsWith('ar') ? 'd MMM yyyy' : 'MMM d, yyyy', { locale })
            : format(currentDate, i18n.language.startsWith('ar') ? 'MMMM yyyy' : 'MMMM yyyy', { locale })
        }</span>
        <button className="px-2" onClick={() => setCurrentDate(view === 'week' ? addDays(currentDate, 7) : addMonths(currentDate, 1))}>&gt;</button>
      </div>
      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow p-4 mb-8 overflow-x-auto">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((wd, i) => (
            <div key={i} className="text-xs font-semibold text-center text-gray-500">{wd}</div>
          ))}
        </div>
        {view === 'week' ? (
          <div className="grid grid-cols-7 gap-2">
            {weekGrid.map((cell, idx) => (
              <div
                key={idx}
                className={`min-h-[90px] rounded-xl shadow-sm border transition-all p-2 flex flex-col items-center relative group cursor-pointer ${isToday(cell.date) ? 'border-purple-500 ring-2 ring-purple-200' : 'border-slate-200 bg-slate-50 hover:bg-purple-50'}`}
                aria-label={`${t('requestsFor', { date: format(cell.date, 'EEEE, MMM d', { locale }) })}`}
              >
                <div className={`text-xs font-bold text-gray-700 text-center mb-1 ${isToday(cell.date) ? 'text-purple-700' : ''}`}>{format(cell.date, 'd', { locale })}</div>
                {cell.requests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-xs text-gray-300 mt-2">
                    <CalendarX className="w-5 h-5 mb-1" />
                    {t('noRequests')}
                  </div>
                ) : (
                  cell.requests.map((req: any) => (
                    <button
                      key={req._id}
                      className={`w-full mt-1 px-2 py-1 rounded-full border text-xs font-medium truncate transition-all ${statusColors[req.status]} hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-400`}
                      onClick={() => setSelectedRequest(req)}
                      aria-label={t('viewRequestAriaLabel', { name: getPatientName(req) })}
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
                aria-label={`${t('requestsFor', { date: format(cell.date, 'EEEE, MMM d', { locale }) })}`}
              >
                <div className={`text-xs font-bold text-gray-700 text-center mb-1 ${isToday(cell.date) ? 'text-purple-700' : ''}`}>{format(cell.date, 'd', { locale })}</div>
                {cell.requests.length === 0 ? null : (
                  cell.requests.map((req: any) => (
                    <button
                      key={req._id}
                      className={`w-full mt-1 px-2 py-1 rounded-full border text-xs font-medium truncate transition-all ${statusColors[req.status]} hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-400`}
                      onClick={() => setSelectedRequest(req)}
                      aria-label={t('viewRequestAriaLabel', { name: getPatientName(req) })}
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
            <h3 className="text-lg font-bold mb-4">{t('teleExpertiseRequestDetails')}</h3>
            <div className="space-y-2 text-sm">
              <div><b>{t('patient')}:</b> {getPatientName(selectedRequest)}</div>
              <div><b>{t('doctor')}:</b> {selectedRequest.doctorId?.firstName || ''} {selectedRequest.doctorId?.lastName || ''}</div>
              <div><b>{t('specialty')}:</b> {selectedRequest.specialty}</div>
              <div><b>{t('status')}:</b> {selectedRequest.status}</div>
              <div><b>{t('details')}:</b> {selectedRequest.details || <span className="italic text-gray-400">{t('noDetails')}</span>}</div>
              {selectedRequest.response && (
                <div><b>{t('response')}:</b> {selectedRequest.response}</div>
              )}
              {selectedRequest.reportUrl && (
                <div><b>{t('reportFile')}:</b> <a href={selectedRequest.reportUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{t('viewReport')}</a></div>
              )}
              {selectedRequest.patientFileUrl && (
                <div><b>{t('patientFile')}:</b> <a href={selectedRequest.patientFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{t('viewFile')}</a></div>
              )}
              <div><b>{t('created')}:</b> {selectedRequest.createdAt ? format(parseISO(selectedRequest.createdAt), 'yyyy-MM-dd HH:mm', { locale }) : '-'}</div>
              <div><b>{t('lastUpdated')}:</b> {selectedRequest.updatedAt ? format(parseISO(selectedRequest.updatedAt), 'yyyy-MM-dd HH:mm', { locale }) : '-'}</div>
            </div>
            <button className="mt-6 px-4 py-2 bg-purple-500 text-white rounded w-full" onClick={() => setSelectedRequest(null)}>{t('close')}</button>
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
                <CardTitle>{req.title || t('teleExpertiseRequest')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div><b>{t('patient')}:</b> {getPatientName(req)}</div>
                <div><b>{t('doctor')}:</b> {req.doctorId?.firstName || ''} {req.doctorId?.lastName || ''}</div>
                <div><b>{t('specialty')}:</b> {req.specialty}</div>
                <div><b>{t('status')}:</b> {req.status}</div>
                <div><b>{t('details')}:</b> {req.details || <span className="italic text-gray-400">{t('noDetails')}</span>}</div>
                {req.response && (
                  <div><b>{t('response')}:</b> {req.response}</div>
                )}
                {req.reportUrl && (
                  <div><b>{t('reportFile')}:</b> <a href={req.reportUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{t('viewReport')}</a></div>
                )}
                {req.patientFileUrl && (
                  <div><b>{t('patientFile')}:</b> <a href={req.patientFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{t('viewFile')}</a></div>
                )}
                <div><b>{t('created')}:</b> {req.createdAt ? format(parseISO(req.createdAt), 'yyyy-MM-dd HH:mm', { locale }) : '-'}</div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default DoctorTeleExpertise;