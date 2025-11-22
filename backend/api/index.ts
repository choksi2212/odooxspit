/**
 * Vercel Serverless Function Entry Point
 * This exports the Fastify app as a serverless handler
 */
import { buildApp } from '../src/app.js';
import prisma from '../src/db/client.js';

let app: any = null;

export default async function handler(req: any, res: any) {
  // Build app on first request (cold start)
  if (!app) {
    app = await buildApp();
    // Decorate with Prisma for easy access
    app.decorate('prisma', prisma);
    await app.ready();
  }

  // Convert Vercel req/res to Fastify-compatible format
  const url = req.url || '/';
  const method = req.method || 'GET';
  
  try {
    // Use Fastify's inject method to handle the request
    const response = await app.inject({
      method: method as any,
      url,
      headers: req.headers || {},
      query: req.query || {},
      payload: req.body,
    });

    // Set status and headers
    res.status(response.statusCode);
    
    // Set response headers
    const headers = response.headers;
    if (headers) {
      Object.keys(headers).forEach((key) => {
        const value = headers[key];
        if (value) {
          res.setHeader(key, Array.isArray(value) ? value[0] : value);
        }
      });
    }

    // Send response body
    const body = response.body || '';
    res.send(body);
  } catch (error: any) {
    console.error('Serverless handler error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error?.message || 'Unknown error' 
    });
  }
}

