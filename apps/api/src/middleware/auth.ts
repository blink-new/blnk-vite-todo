import { Context, Next } from 'hono';
import { getAuth } from '../firebase/admin';

/**
 * Authentication middleware for Hono
 * Verifies the Firebase ID token in the Authorization header
 * Sets the decoded user in the context for use in route handlers
 */
export async function authMiddleware(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized - Missing or invalid token format' }, 401);
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      const auth = await getAuth();
      const decodedToken = await auth.verifyIdToken(token);
      
      // Set the user in the context for use in route handlers
      c.set('user', decodedToken);
      
      // Continue to the next middleware or route handler
      await next();
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      return c.json({ 
        error: 'Unauthorized - Invalid token',
        details: tokenError instanceof Error ? tokenError.message : 'Unknown error'
      }, 401);
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ 
      error: 'Internal server error during authentication',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}

/**
 * Role-based authorization middleware
 * Use after authMiddleware to check if the user has the required role
 * @param roles Array of allowed roles
 */
export function roleMiddleware(roles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ error: 'Unauthorized - User not authenticated' }, 401);
    }
    
    // Check if user has any of the required roles
    const userRoles = user.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return c.json({ error: 'Forbidden - Insufficient permissions' }, 403);
    }
    
    await next();
  };
}