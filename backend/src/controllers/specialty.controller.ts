import { Request, Response } from 'express';
import Specialty from '../models/specialty.model';

export const getSpecialties = async (req: Request, res: Response) => {
  try {
    const specialties = await Specialty.find().sort({ name: 1 });
    res.json(specialties);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch specialties', error: err });
  }
};

export const addSpecialty = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const specialty = new Specialty({ name, description });
    await specialty.save();
    res.status(201).json(specialty);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add specialty', error: err });
  }
}; 