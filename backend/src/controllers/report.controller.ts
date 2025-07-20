import { Request, Response } from 'express';
import User from '../models/user.model';
import Appointment from '../models/appointment.model';
import AuditLog from '../models/auditLog.model';

export const getOverviewStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeProviders = await User.countDocuments({ role: 'doctor', isActive: true });
    const appointmentsToday = await Appointment.countDocuments({ date: { $gte: new Date(new Date().setHours(0,0,0,0)) } });
    // For demo, system uptime is mocked
    const systemUptime = 99.9;
    res.json({ totalUsers, activeProviders, appointmentsToday, systemUptime });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch overview stats', error: err });
  }
};

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const total = await User.countDocuments();
    const byRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    res.json({ total, byRole });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user stats', error: err });
  }
};

export const getAppointmentStats = async (req: Request, res: Response) => {
  try {
    const total = await Appointment.countDocuments();
    const completed = await Appointment.countDocuments({ status: 'completed' });
    const cancelled = await Appointment.countDocuments({ status: 'cancelled' });
    const byProvider = await Appointment.aggregate([
      { $group: { _id: '$providerId', count: { $sum: 1 } } }
    ]);
    res.json({ total, completed, cancelled, byProvider });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch appointment stats', error: err });
  }
};

export const getSystemStats = async (req: Request, res: Response) => {
  try {
    const errorLogs = await AuditLog.countDocuments({ status: 'Failed' });
    // For demo, system uptime is mocked
    const systemUptime = 99.9;
    res.json({ errorLogs, systemUptime });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch system stats', error: err });
  }
}; 