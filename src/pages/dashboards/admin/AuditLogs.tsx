import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search, Download, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 10;

const AuditLogs: React.FC = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchLogs = async (pageNum = 1, searchTerm = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(PAGE_SIZE),
        ...(searchTerm ? { search: searchTerm } : {})
      });
      const res = await fetch(`/api/audit-logs?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('authToken')}` }
      });
      if (!res.ok) throw new Error('failedToFetchLogs');
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      toast.error(t('failedToFetchAuditLogs') || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page, search);
    // eslint-disable-next-line
  }, [page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('auditLogs') || 'Audit Logs'}</h1>
          <p className="text-gray-600">{t('viewSystemActivityLogs') || 'View system activity and user actions'}</p>
        </div>
        <Button variant="outline" onClick={() => toast.info(t('exportComingSoon') || 'Export coming soon!')}>
          <Download className="h-4 w-4 mr-2" />
          {t('exportLogs') || 'Export Logs'}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <form className="flex items-center space-x-4" onSubmit={handleSearch}>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t('searchLogs') || 'Search logs...'}
                className="pl-10"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
            </div>
            <Button variant="outline" type="submit">
              <Filter className="h-4 w-4 mr-2" />
              {t('filter') || 'Filter'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>{t('systemActivityLogs') || 'System Activity Logs'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">{t('loadingLogs') || 'Loading logs...'}</div>
          ) : logs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">{t('noLogsFound') || 'No logs found.'}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">{t('timestamp') || 'Timestamp'}</th>
                    <th className="text-left py-3 px-4 font-medium">{t('user') || 'User'}</th>
                    <th className="text-left py-3 px-4 font-medium">{t('action') || 'Action'}</th>
                    <th className="text-left py-3 px-4 font-medium">{t('resource') || 'Resource'}</th>
                    <th className="text-left py-3 px-4 font-medium">{t('status') || 'Status'}</th>
                    <th className="text-left py-3 px-4 font-medium">{t('ipAddress') || 'IP Address'}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr className="border-b hover:bg-gray-50" key={log._id}>
                      <td className="py-3 px-4 text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-4">{log.user?.email || 'Unknown'}</td>
                      <td className="py-3 px-4">{log.action}</td>
                      <td className="py-3 px-4">{log.resource}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{log.ipAddress || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                {t('previous') || 'Previous'}
              </Button>
              <span className="text-sm">{t('page')} {page} {t('of')} {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                {t('next') || 'Next'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs; 