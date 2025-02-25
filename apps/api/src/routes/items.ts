import { Hono } from 'hono';
import { getDb } from '../firebase/admin';
import { authMiddleware } from '../middleware/auth';
import { z } from 'zod';

// Define a schema for item validation
const ItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  category: z.string().optional(),
  isActive: z.boolean().default(true),
});

type Item = z.infer<typeof ItemSchema>;

// Create a Hono router for items
const items = new Hono();

// Apply auth middleware to all routes
items.use('*', authMiddleware);

// Get all items
items.get('/', async (c) => {
  try {
    const db = await getDb();
    const snapshot = await db.collection('items').get();
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return c.json({ items });
  } catch (error) {
    console.error('Error fetching items:', error);
    return c.json({ 
      error: 'Failed to fetch items',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get a single item by ID
items.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = await getDb();
    const doc = await db.collection('items').doc(id).get();
    
    if (!doc.exists) {
      return c.json({ error: 'Item not found' }, 404);
    }
    
    return c.json({
      id: doc.id,
      ...doc.data()
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    return c.json({ 
      error: 'Failed to fetch item',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Create a new item
items.post('/', async (c) => {
  try {
    const data = await c.req.json();
    
    // Validate the request body
    const validationResult = ItemSchema.safeParse(data);
    
    if (!validationResult.success) {
      return c.json({ 
        error: 'Validation failed', 
        details: validationResult.error.format() 
      }, 400);
    }
    
    const db = await getDb();
    const docRef = await db.collection('items').add(validationResult.data);
    
    return c.json({ 
      message: 'Item created successfully',
      id: docRef.id 
    }, 201);
  } catch (error) {
    console.error('Error creating item:', error);
    return c.json({ 
      error: 'Failed to create item',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Update an item
items.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    
    // Validate the request body
    const validationResult = ItemSchema.safeParse(data);
    
    if (!validationResult.success) {
      return c.json({ 
        error: 'Validation failed', 
        details: validationResult.error.format() 
      }, 400);
    }
    
    const db = await getDb();
    await db.collection('items').doc(id).update(validationResult.data);
    
    return c.json({ message: 'Item updated successfully' });
  } catch (error) {
    console.error('Error updating item:', error);
    return c.json({ 
      error: 'Failed to update item',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Delete an item
items.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = await getDb();
    await db.collection('items').doc(id).delete();
    
    return c.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return c.json({ 
      error: 'Failed to delete item',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default items;