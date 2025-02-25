import * as admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let adminApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 * When deployed to Firebase Functions, this will automatically use the default credentials
 * For local development, it will look for a serviceAccountKey.json file
 */
export const initializeAdmin = async () => {
  if (!adminApp) {
    try {
      // For local development
      if (process.env.NODE_ENV === 'development') {
        try {
          // Try to load local service account file
          const serviceAccountPath = join(__dirname, '../../../serviceAccountKey.json');
          const serviceAccount = JSON.parse(
            await readFile(serviceAccountPath, 'utf-8')
          );
          
          adminApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET
          });
          console.log('Initialized Firebase Admin with local service account');
        } catch (error) {
          console.log('No service account file found, using minimal config for development');
          // For local development without service account, use a minimal config
          adminApp = admin.initializeApp({
            projectId: 'demo-project',
            storageBucket: 'demo-project.appspot.com'
          });
        }
      } else {
        // In production (Firebase Functions), use default credentials
        adminApp = admin.initializeApp();
        console.log('Initialized Firebase Admin with default credentials');
      }
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      throw error;
    }
  }
  
  return adminApp;
};

// Export admin services getter functions
export const getDb = async () => (await initializeAdmin()).firestore();
export const getAuth = async () => (await initializeAdmin()).auth();
export const getStorage = async () => (await initializeAdmin()).storage();

export default initializeAdmin;