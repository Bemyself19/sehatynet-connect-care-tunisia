import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { ChartContainer } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';

const COLORS = ['#6366f1', '#22d3ee', '#f59e42', '#f43f5e', '#10b981', '#a78bfa'];

const mockTrends = [
  { date: '2024-06-01', appointments: 5, newPatients: 2 },
  { date: '2024-06-02', appointments: 8, newPatients: 3 },
  { date: '2024-06-03', appointments: 6, newPatients: 1 },
  { date: '2024-06-04', appointments: 10, newPatients: 4 },
  { date: '2024-06-05', appointments: 7, newPatients: 2 },
  { date: '2024-06-06', appointments: 9, newPatients: 3 },
  { date: '2024-06-07', appointments: 4, newPatients: 1 },
];
const mockStatus = [
  { name: 'Completed', value: 24 },
  { name: 'Pending', value: 6 },
  { name: 'Cancelled', value: 3 },
  { name: 'No-show', value: 2 },
];

const DoctorAnalytics: React.FC = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (error) {
        setStats(null);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  // Transform backend data for charts
  const trends = stats?.apptTrends?.map((tItem: any) => ({
    date: tItem._id,
    appointments: tItem.count,
    newPatients: stats?.newPatients?.find((n: any) => n._id === tItem._id)?.count || 0
  })) || [];

  const statusData = stats?.apptStatus?.map((s: any) => ({
    name: t(`analyticsPage.status.${s._id}`),
    value: s.value
  })) || [];

  const newPatientsData = stats?.newPatients?.map((n: any) => ({
    date: n._id,
    newPatients: n.count
  })) || [];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mb-4">{t('analyticsPage.title')}</h2>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader><CardTitle>{t('analyticsPage.totalAppointments')}</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats?.totalAppointments ?? '--'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t('analyticsPage.totalPatients')}</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats?.totalPatients ?? '--'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t('analyticsPage.totalTeleExpertise')}</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats?.totalTeleExpertise ?? '--'}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t('analyticsPage.totalPrescriptions')}</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats?.totalPrescriptions ?? '--'}</div></CardContent>
        </Card>
      </div>
      {/* Trends Line Chart */}
      <Card>
        <CardHeader><CardTitle>{t('analyticsPage.appointmentsOverTime')}</CardTitle></CardHeader>
        <CardContent style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="appointments" stroke="#6366f1" strokeWidth={2} name={t('analyticsPage.appointments')} />
              <Line type="monotone" dataKey="newPatients" stroke="#22d3ee" strokeWidth={2} name={t('analyticsPage.newPatients')} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      {/* Status Pie Chart & New Patients Bar Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{t('analyticsPage.statusBreakdown')}</CardTitle></CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {statusData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t('analyticsPage.newPatientsThisWeek')}</CardTitle></CardHeader>
          <CardContent style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={newPatientsData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="newPatients" fill="#22d3ee" name={t('analyticsPage.newPatients')} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorAnalytics;