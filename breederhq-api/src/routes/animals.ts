// breederhq-api/src/routes/animals.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * PATCH /api/v1/animals/:id
 * Update animal with validation for femaleCycleLenOverrideDays
 */
export async function updateAnimal(req: Request, res: Response) {
  const { id } = req.params;
  const updates = req.body;

  // Validate femaleCycleLenOverrideDays if provided
  if ('femaleCycleLenOverrideDays' in updates) {
    const value = updates.femaleCycleLenOverrideDays;

    // Allow null to clear override
    if (value !== null) {
      // Must be an integer
      if (!Number.isInteger(value)) {
        return res.status(400).json({
          error: 'invalid_cycle_len_override',
          detail: 'must be an integer between 30 and 730 days'
        });
      }

      // Range validation: 30-730 days
      if (value < 30 || value > 730) {
        return res.status(400).json({
          error: 'invalid_cycle_len_override',
          detail: 'must be an integer between 30 and 730 days'
        });
      }
    }
  }

  try {
    const animal = await prisma.animal.update({
      where: { id: Number(id) },
      data: updates
    });

    return res.json(animal);
  } catch (error) {
    console.error('[animals] update failed', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}

/**
 * GET /api/v1/animals/:id
 * Retrieve animal including femaleCycleLenOverrideDays
 */
export async function getAnimal(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const animal = await prisma.animal.findUnique({
      where: { id: Number(id) }
    });

    if (!animal) {
      return res.status(404).json({ error: 'not_found' });
    }

    return res.json(animal);
  } catch (error) {
    console.error('[animals] get failed', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}
