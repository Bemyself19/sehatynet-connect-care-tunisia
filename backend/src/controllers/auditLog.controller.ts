import { Request, Response } from 'express';
import AuditLog from '../models/auditLog.model';
import User from '../models/user.model';

// GET /api/audit-logs
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search = '', status, action, user } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (action) query.action = action;
    if (user) query.user = user;
    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { resource: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } }
      ];
    }
    const logs = await AuditLog.find(query)
      .populate('user', 'email')
      .sort({ timestamp: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);
    const total = await AuditLog.countDocuments(query);
    res.json({ logs, total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch audit logs', error: err });
  }
};

// POST /api/audit-logs
export const createAuditLog = async (req: Request, res: Response) => {
  try {
    const { user, action, resource, status, ipAddress, details } = req.body;
    const log = new AuditLog({ user, action, resource, status, ipAddress, details });
    await log.save();
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create audit log', error: err });
  }
}; 