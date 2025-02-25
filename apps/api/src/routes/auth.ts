import { Hono } from 'hono';
import { getAuth } from '../firebase/admin';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';

// Define schemas for validation
const CreateUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().optional(),
  photoURL: z.string().url().optional(),
  disabled: z.boolean().optional().default(false),
  emailVerified: z.boolean().optional().default(false),
});

const UpdateUserSchema = z.object({
  displayName: z.string().optional(),
  photoURL: z.string().url().optional(),
  email: z.string().email("Invalid email format").optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  disabled: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
});

// Create a Hono router for auth operations
const authRoutes = new Hono();

// Public routes (no auth required)

// Create a new user (admin only in production)
authRoutes.post('/users', async (c) => {
  try {
    const data = await c.req.json();
    
    // Validate the request body
    const validationResult = CreateUserSchema.safeParse(data);
    
    if (!validationResult.success) {
      return c.json({ 
        error: 'Validation failed', 
        details: validationResult.error.format() 
      }, 400);
    }
    
    const { email, password, displayName, photoURL, disabled, emailVerified } = validationResult.data;
    
    // Create the user in Firebase Auth
    const auth = await getAuth();
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      photoURL,
      disabled,
      emailVerified
    });
    
    return c.json({ 
      message: 'User created successfully',
      uid: userRecord.uid 
    }, 201);
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({ 
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Protected routes (require auth)
const protectedRoutes = new Hono();
protectedRoutes.use('*', authMiddleware);

// Get the current user's profile
protectedRoutes.get('/me', async (c) => {
  try {
    const user = c.get('user');
    
    // Get the full user record from Firebase Auth
    const auth = await getAuth();
    const userRecord = await auth.getUser(user.uid);
    
    return c.json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      emailVerified: userRecord.emailVerified,
      createdAt: userRecord.metadata.creationTime,
      lastSignInTime: userRecord.metadata.lastSignInTime
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return c.json({ 
      error: 'Failed to fetch user profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Update the current user's profile
protectedRoutes.patch('/me', async (c) => {
  try {
    const user = c.get('user');
    const data = await c.req.json();
    
    // Validate the request body
    const validationResult = UpdateUserSchema.safeParse(data);
    
    if (!validationResult.success) {
      return c.json({ 
        error: 'Validation failed', 
        details: validationResult.error.format() 
      }, 400);
    }
    
    // Update the user in Firebase Auth
    const auth = await getAuth();
    const userRecord = await auth.updateUser(user.uid, validationResult.data);
    
    return c.json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      emailVerified: userRecord.emailVerified,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return c.json({ 
      error: 'Failed to update user profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Admin routes (for user management)
protectedRoutes.get('/users/:uid', async (c) => {
  try {
    const uid = c.req.param('uid');
    
    // Get the user record from Firebase Auth
    const auth = await getAuth();
    const userRecord = await auth.getUser(uid);
    
    return c.json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      disabled: userRecord.disabled,
      emailVerified: userRecord.emailVerified,
      createdAt: userRecord.metadata.creationTime,
      lastSignInTime: userRecord.metadata.lastSignInTime
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ 
      error: 'Failed to fetch user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Update a user (admin only)
protectedRoutes.patch('/users/:uid', async (c) => {
  try {
    const uid = c.req.param('uid');
    const data = await c.req.json();
    
    // Validate the request body
    const validationResult = UpdateUserSchema.safeParse(data);
    
    if (!validationResult.success) {
      return c.json({ 
        error: 'Validation failed', 
        details: validationResult.error.format() 
      }, 400);
    }
    
    // Update the user in Firebase Auth
    const auth = await getAuth();
    const userRecord = await auth.updateUser(uid, validationResult.data);
    
    return c.json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      disabled: userRecord.disabled,
      emailVerified: userRecord.emailVerified,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return c.json({ 
      error: 'Failed to update user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Delete a user (admin only)
protectedRoutes.delete('/users/:uid', async (c) => {
  try {
    const uid = c.req.param('uid');
    
    // Delete the user from Firebase Auth
    const auth = await getAuth();
    await auth.deleteUser(uid);
    
    return c.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ 
      error: 'Failed to delete user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Mount protected routes
authRoutes.route('/', protectedRoutes);

export default authRoutes;