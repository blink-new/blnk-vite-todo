import { Hono } from 'hono';
import { getStorage } from '../firebase/admin';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';

// Define a schema for upload request validation
const UploadRequestSchema = z.object({
  fileName: z.string().min(1, "Filename is required"),
  contentType: z.string().min(1, "Content type is required"),
  folder: z.string().optional().default('uploads')
});

// Create a Hono router for storage operations
const storageRoutes = new Hono();

// Apply auth middleware to all routes
storageRoutes.use('*', authMiddleware);

// Generate a signed URL for uploading a file
storageRoutes.post('/upload-url', async (c) => {
  try {
    const data = await c.req.json();
    
    // Validate the request body
    const validationResult = UploadRequestSchema.safeParse(data);
    
    if (!validationResult.success) {
      return c.json({ 
        error: 'Validation failed', 
        details: validationResult.error.format() 
      }, 400);
    }
    
    const { fileName, contentType, folder } = validationResult.data;
    
    // Get the authenticated user from context
    const user = c.get('user');
    
    // Create a unique file path including user ID for security
    const filePath = `${folder}/${user.uid}/${Date.now()}_${fileName}`;
    
    // Get the storage bucket
    const storage = await getStorage();
    const bucket = storage.bucket();
    
    // Create a reference to the file
    const file = bucket.file(filePath);
    
    // Generate a signed URL for uploading
    const [signedUrl] = await file.getSignedUrl({
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // URL expires in 15 minutes
      contentType
    });
    
    return c.json({
      signedUrl,
      filePath,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return c.json({ 
      error: 'Failed to generate upload URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// List files for the authenticated user
storageRoutes.get('/files', async (c) => {
  try {
    // Get the authenticated user from context
    const user = c.get('user');
    
    // Get the folder parameter or use default
    const folder = c.req.query('folder') || 'uploads';
    
    // Create the path prefix for the user's files
    const prefix = `${folder}/${user.uid}/`;
    
    // Get the storage bucket
    const storage = await getStorage();
    const bucket = storage.bucket();
    
    // List files with the prefix
    const [files] = await bucket.getFiles({ prefix });
    
    // Map files to a more usable format
    const fileList = files.map(file => {
      const { name, metadata } = file;
      return {
        name,
        path: name,
        contentType: metadata.contentType,
        size: parseInt(metadata.size, 10),
        createdAt: metadata.timeCreated,
        updatedAt: metadata.updated,
        downloadUrl: `https://storage.googleapis.com/${bucket.name}/${name}`
      };
    });
    
    return c.json({ files: fileList });
  } catch (error) {
    console.error('Error listing files:', error);
    return c.json({ error: 'Failed to list files' }, 500);
  }
});

// Delete a file
storageRoutes.delete('/files/:filename', async (c) => {
  try {
    // Get the authenticated user from context
    const user = c.get('user');
    
    // Get the filename from the URL parameter
    const filename = c.req.param('filename');
    
    // Get the folder parameter or use default
    const folder = c.req.query('folder') || 'uploads';
    
    // Create the full path to the file
    const filePath = `${folder}/${user.uid}/${filename}`;
    
    // Get the storage bucket
    const storage = await getStorage();
    const bucket = storage.bucket();
    
    // Check if the file exists
    const [exists] = await bucket.file(filePath).exists();
    
    if (!exists) {
      return c.json({ error: 'File not found' }, 404);
    }
    
    // Delete the file
    await bucket.file(filePath).delete();
    
    return c.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return c.json({ 
      error: 'Failed to delete file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Generate a signed URL for downloading a file
storageRoutes.get('/download-url/:filePath(*)', async (c) => {
  try {
    const filePath = c.req.param('filePath');
    
    // Get the storage bucket
    const storage = await getStorage();
    const bucket = storage.bucket();
    
    // Create a reference to the file
    const file = bucket.file(filePath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      return c.json({ error: 'File not found' }, 404);
    }
    
    // Generate a signed URL for downloading
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000 // URL expires in 1 hour
    });
    
    return c.json({
      signedUrl,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    return c.json({ 
      error: 'Failed to generate download URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default storageRoutes;