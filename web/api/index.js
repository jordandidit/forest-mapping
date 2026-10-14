/**
 * Vercel serverless entry — wraps the Express access-server.
 * All `/api/*` requests are rewritten here (see vercel.json).
 * Deploy stamp: 2026-10-14-oauth-loop-fix
 */
import app from '../server/access-server.js'

export default app
