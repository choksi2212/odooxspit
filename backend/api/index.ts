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
  
  // Use Fastify's inject method for testing, but for Vercel we need to handle differently
  // Actually, we need to use Fastify's serverless adapter
  try {
    // For Vercel, we need to handle the request through Fastify's routing
    const response = await app.inject({
      method,
      url,
      headers: req.headers || {},
      query: req.query || {},
      body: req.body,
      payload: req.body,
    });

    // Set status and headers
    res.statusCode = response.statusCode;
    Object.keys(response.headers).forEach((key) => {
      res.setHeader(key, response.headers[key] as string);
    });

    // Send response
    res.end(response.body);
  } catch (error: any) {
    console.error('Serverless handler error:', error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Internal server error', message: error.message }));
  }
}

