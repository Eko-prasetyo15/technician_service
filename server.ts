import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ServiceReport, User } from './src/types/index.ts';
import { db } from './src/server/db.ts';
import { deleteCloudinaryImages, uploadProfileImage, uploadReportPhotos } from './src/server/cloudinary.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const asyncRoute = (
  handler: (req: Request, res: Response) => Promise<unknown> | unknown
): express.RequestHandler => (req, res, next) => {
  Promise.resolve(handler(req, res)).catch(next);
};

export async function createApp() {
  const app = express();

  await db.initialize(async (reports) => (await uploadReportPhotos(reports)).reports);

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // --- REST API ROUTES ---

  // Health
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Dashboard Stats
  app.get('/api/stats', (_req: Request, res: Response) => {
    res.json(db.getStats());
  });

  // Auth / Current User
  app.get('/api/auth/current', (_req: Request, res: Response) => {
    res.json(db.getCurrentUser());
  });

  app.post('/api/auth/switch', asyncRoute(async (req: Request, res: Response) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const user = await db.switchUser(userId);
    res.json(user);
  }));

  // Users / Technicians
  app.get('/api/users', (_req: Request, res: Response) => {
    res.json(db.getUsers());
  });

  app.post('/api/users', asyncRoute(async (req: Request, res: Response) => {
    const { name, email, phone, role, specialization, status } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const newUser = await db.createUser({
      name,
      email,
      phone: phone || '',
      role: role || 'technician',
      specialization: specialization || 'General Maintenance',
      status: status || 'active',
    });
    res.status(201).json(newUser);
  }));

  app.put('/api/users/:id', asyncRoute(async (req: Request, res: Response) => {
    const updated = await db.updateUser(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(updated);
  }));

  app.put('/api/users/:id/profile', asyncRoute(async (req: Request, res: Response) => {
    const { name, email, phone, specialization, profileImageDataUrl, removeProfileImage } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Nama dan email wajib diisi.' });
    }

    const existing = db.getUsers().find((user) => user.id === req.params.id);
    if (!existing) return res.status(404).json({ error: 'User not found' });

    const uploaded = profileImageDataUrl ? await uploadProfileImage(profileImageDataUrl) : null;
    const updates = {
      name: name.trim(),
      email: email.trim(),
      phone: typeof phone === 'string' ? phone.trim() : '',
      specialization: typeof specialization === 'string' ? specialization.trim() : '',
      ...(uploaded
        ? { profileImageUrl: uploaded.url, profileImagePublicId: uploaded.publicId }
        : removeProfileImage
          ? { profileImageUrl: '', profileImagePublicId: '' }
          : {}),
    };

    let updated: User | null;
    try {
      updated = await db.updateUser(req.params.id, updates);
      if (!updated) throw new Error('User not found');
    } catch (error) {
      if (uploaded) {
        try {
          await deleteCloudinaryImages([uploaded.publicId]);
        } catch (cleanupError) {
          console.error('Failed to clean up uploaded profile image after database error:', cleanupError);
        }
      }
      throw error;
    }

    const previousPublicId = existing.profileImagePublicId;
    if (previousPublicId && previousPublicId !== updated.profileImagePublicId) {
      try {
        await deleteCloudinaryImages([previousPublicId]);
      } catch (error) {
        console.error('Failed to delete the previous Cloudinary profile image:', error);
      }
    }

    res.json(updated);
  }));

  // Categories
  app.get('/api/categories', (_req: Request, res: Response) => {
    res.json(db.getCategories());
  });

  app.post('/api/categories', asyncRoute(async (req: Request, res: Response) => {
    const { name, code, description, iconName } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Nama kategori wajib diisi' });
    }
    const created = await db.createCategory({
      name,
      code: code || name.slice(0, 4).toUpperCase(),
      description: description || '',
      iconName: iconName || 'Wrench',
    });
    res.status(201).json(created);
  }));

  app.put('/api/categories/:id', asyncRoute(async (req: Request, res: Response) => {
    const updated = await db.updateCategory(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    res.json(updated);
  }));

  app.delete('/api/categories/:id', asyncRoute(async (req: Request, res: Response) => {
    const ok = await db.deleteCategory(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    res.json({ success: true });
  }));

  // Equipment
  app.get('/api/equipment', (req: Request, res: Response) => {
    const { categoryId, search, status } = req.query;
    res.json(
      db.getEquipment({
        categoryId: categoryId as string,
        search: search as string,
        status: status as string,
      })
    );
  });

  app.get('/api/equipment/:id', (req: Request, res: Response) => {
    const item = db.getEquipmentById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Equipment not found' });
    res.json(item);
  });

  app.post('/api/equipment', asyncRoute(async (req: Request, res: Response) => {
    const { name, categoryId, brand, model, serialNumber, capacity, location, maintenanceIntervalDays, status } = req.body;
    if (!name || !categoryId || !location) {
      return res.status(400).json({ error: 'Name, category, and location are required' });
    }
    const created = await db.createEquipment({
      name,
      categoryId,
      categoryName: req.body.categoryName || '',
      brand: brand || '',
      model: model || '',
      serialNumber: serialNumber || '',
      capacity: capacity || '',
      location,
      installationDate: req.body.installationDate,
      maintenanceIntervalDays: Number(maintenanceIntervalDays) || 30,
      status: status || 'active',
      lastServiceDate: req.body.lastServiceDate,
      nextServiceDate: req.body.nextServiceDate || '',
      notes: req.body.notes || '',
    });
    res.status(201).json(created);
  }));

  app.put('/api/equipment/:id', asyncRoute(async (req: Request, res: Response) => {
    const updated = await db.updateEquipment(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Equipment not found' });
    res.json(updated);
  }));

  app.delete('/api/equipment/:id', asyncRoute(async (req: Request, res: Response) => {
    const ok = await db.deleteEquipment(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Equipment not found' });
    res.json({ success: true });
  }));

  // Service Schedules
  app.get('/api/schedules', (req: Request, res: Response) => {
    const technicianId = req.query.technicianId as string | undefined;
    res.json(db.getSchedules(technicianId));
  });

  app.get('/api/schedules/:id', (req: Request, res: Response) => {
    const item = db.getScheduleById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Schedule not found' });
    res.json(item);
  });

  app.post('/api/schedules', asyncRoute(async (req: Request, res: Response) => {
    const { title, equipmentId, technicianId, scheduledDate, scheduledTime, jobType, priority, notes } = req.body;
    if (!title || !equipmentId || !scheduledDate || !jobType) {
      return res.status(400).json({ error: 'Title, equipment, date, and job type are required' });
    }
    const created = await db.createSchedule({
      title,
      equipmentId,
      equipmentName: req.body.equipmentName || '',
      location: req.body.location || '',
      technicianId: technicianId || '',
      technicianName: req.body.technicianName || '',
      scheduledDate,
      scheduledTime: scheduledTime || '09:00',
      jobType,
      priority: priority || 'Medium',
      notes: notes || '',
      status: req.body.status || 'Scheduled',
    });
    res.status(201).json(created);
  }));

  app.put('/api/schedules/:id', asyncRoute(async (req: Request, res: Response) => {
    const updated = await db.updateSchedule(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Schedule not found' });
    res.json(updated);
  }));

  app.delete('/api/schedules/:id', asyncRoute(async (req: Request, res: Response) => {
    const ok = await db.deleteSchedule(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Schedule not found' });
    res.json({ success: true });
  }));

  // Service Reports
  app.get('/api/reports', (req: Request, res: Response) => {
    const { equipmentId, technicianId } = req.query;
    res.json(
      db.getReports({
        equipmentId: equipmentId as string,
        technicianId: technicianId as string,
      })
    );
  });

  app.get('/api/reports/:id', (req: Request, res: Response) => {
    const item = db.getReportById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Report not found' });
    res.json(item);
  });

  app.post('/api/reports', asyncRoute(async (req: Request, res: Response) => {
    const { equipmentId, jobDate, jobType, actionTaken } = req.body;
    if (!equipmentId || !jobDate || !actionTaken) {
      return res.status(400).json({ error: 'Equipment, date, and action taken are required' });
    }

    const uploaded = await uploadReportPhotos([req.body as ServiceReport]);
    let created: ServiceReport;
    try {
      created = await db.createReport(uploaded.reports[0]);
    } catch (error) {
      try {
        await deleteCloudinaryImages(uploaded.publicIds);
      } catch (cleanupError) {
        console.error('Failed to clean up uploaded report images after database error:', cleanupError);
      }
      throw error;
    }
    res.status(201).json(created);
  }));

  // Offline Sync Batch Endpoint
  app.post('/api/reports/batch-sync', asyncRoute(async (req: Request, res: Response) => {
    const { reports } = req.body;
    if (!Array.isArray(reports) || reports.length === 0) {
      return res.status(400).json({ error: 'Reports array is required' });
    }
    const uploaded = await uploadReportPhotos(reports as ServiceReport[]);
    const synced = await db.batchSyncReports(uploaded.reports);
    res.json({ success: true, count: synced.length, synced });
  }));

  // Reminders
  app.get('/api/reminders', (_req: Request, res: Response) => {
    res.json(db.getReminders());
  });

  app.post('/api/reminders/:id/acknowledge', asyncRoute(async (req: Request, res: Response) => {
    const ok = await db.acknowledgeReminder(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Reminder not found' });
    res.json({ success: true });
  }));

  app.post('/api/reminders/process', asyncRoute(async (_req: Request, res: Response) => {
    const reminders = await db.processReminders();
    res.json({ count: reminders.length, reminders });
  }));

  // Company Settings
  app.get('/api/company', (_req: Request, res: Response) => {
    res.json(db.getCompanySettings());
  });

  app.put('/api/company', asyncRoute(async (req: Request, res: Response) => {
    const updated = await db.updateCompanySettings(req.body);
    res.json(updated);
  }));

  app.use((error: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
    console.error('[API] Request failed:', error);
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    res.status(500).json({ error: message });
  });

  if (!process.env.VERCEL) {
    const isDev = process.env.NODE_ENV !== 'production';

    if (isDev) {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.resolve(__dirname, 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  return app;
}

async function startServer() {
  const app = await createApp();
  const PORT = Number(process.env.PORT) || 3000;

  console.log('[Automated Cron] Initializing service maintenance reminder engine...');
  const reminderCron = setInterval(() => {
    db.processReminders().catch((error) => {
      console.error('[Automated Cron] Error checking maintenance schedules:', error);
    });
  }, 60 * 1000);

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Technician App] Server running on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    clearInterval(reminderCron);
    server.close((error) => {
      if (error) {
        console.error('Failed to close HTTP server cleanly:', error);
        process.exitCode = 1;
      }
      db.close().catch((closeError) => {
        console.error('Failed to close Neon database pool cleanly:', closeError);
        process.exitCode = 1;
      });
    });
  });
}

if (process.env.VERCEL !== '1') {
  startServer().catch((err) => {
    console.error('Fatal server startup error:', err);
    process.exit(1);
  });
}
