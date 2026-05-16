import * as admin from 'firebase-admin';
import { ReportData } from './types';
import { logger } from './logger';

// Handle Firebase initialization with a singleton pattern to prevent double-init in Next.js hot reload
if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    // Replace literal '\n' string to actual newline characters if they come from standard .env
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      logger.warn('Firebase Admin credentials are not fully configured in environment variables.', 'Firestore');
      if (process.env.NODE_ENV === 'production') {
        logger.error('Firebase credentials missing in production — reports will not be saved.', 'Firestore');
      }
    } else {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      logger.info('Firebase Admin initialized successfully.', 'Firestore');
    }
  } catch (error: any) {
    logger.error('Firebase Admin initialization error', 'Firestore', error.stack);
  }
}

const db = admin.apps.length ? admin.firestore() : null;

/** Returns the Firestore instance, or null if Firebase is not configured. */
export function getDb() { return db; }

export async function saveReport(data: ReportData): Promise<string> {
  if (!db) {
    logger.warn('Firestore is not initialized. Simulating saveReport for local testing.', 'Firestore');
    return 'demo-report-id-' + Date.now();
  }
  
  const reportRef = db.collection('reports').doc();
  await reportRef.set({
    ...data,
    reportedAt: admin.firestore.Timestamp.fromDate(data.reportedAt),
  });
  
  return reportRef.id;
}

export async function getRecentReports(days: number): Promise<ReportData[]> {
  if (!db) {
    logger.warn('Firestore is not initialized. Simulating getRecentReports.', 'Firestore');
    return [];
  }

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - days);

  const snapshot = await db.collection('reports')
    .where('reportedAt', '>=', admin.firestore.Timestamp.fromDate(pastDate))
    .orderBy('reportedAt', 'desc')
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      reportedAt: data.reportedAt.toDate(),
    } as ReportData;
  });
}

export async function getReportsGeoJSON(): Promise<object> {
  if (!db) {
    logger.warn('Firestore is not initialized. Simulating getReportsGeoJSON with dummy data.', 'Firestore');
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [106.8229, -6.1944] },
          properties: { id: 'dummy-1', speciesName: 'Sapu-Sapu', reportedAt: new Date().toISOString(), urgency: 'TINGGI', locationName: 'Sungai Ciliwung' }
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [112.7521, -7.2504] },
          properties: { id: 'dummy-2', speciesName: 'Red Devil', reportedAt: new Date(Date.now() - 86400000).toISOString(), urgency: 'DARURAT', locationName: 'Kalimas Surabaya' }
        }
      ]
    };
  }

  const snapshot = await db.collection('reports')
    .orderBy('reportedAt', 'desc')
    .limit(500)
    .get();
  
  const features = snapshot.docs
    .map(doc => {
      const data = doc.data();
      if (data.latitude !== undefined && data.longitude !== undefined) {
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [data.longitude, data.latitude],
          },
          properties: {
            id: doc.id,
            speciesName: data.speciesName,
            scientificName: data.scientificName,
            invasiveStatus: data.invasiveStatus,
            locationName: data.locationName,
            quantity: data.quantity,
            waterCondition: data.waterCondition,
            reporterInitial: data.reporterInitial,
            reportedAt: data.reportedAt ? data.reportedAt.toDate().toISOString() : null,
            urgency: data.urgency,
            imageUrl: data.imageUrl || null,
          },
        };
      }
      return null;
    })
    .filter(feature => feature !== null);

  return {
    type: 'FeatureCollection',
    features,
  };
}

export async function getTotalReportCount(): Promise<number> {
  if (!db) return 0;
  try {
    const snapshot = await db.collection('reports').count().get();
    return snapshot.data().count;
  } catch {
    return 0;
  }
}
