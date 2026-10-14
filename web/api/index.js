/**
 * Vercel serverless entry — wraps the Express access-server.
 * All `/api/*` requests are rewritten here (see vercel.json).
 */
import app from '../server/access-server.js'

export default app
