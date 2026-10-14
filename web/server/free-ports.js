/**
 * Free common local dev ports before `npm run dev`.
 * Avoids a stale access-server/vite process causing concurrently to exit.
 */
import { execSync } from 'node:child_process'

const PORTS = [8787, 5173]

function pidsOnPort(port) {
  try {
    if (process.platform === 'win32') {
      const out = execSync(
        `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique"`,
        { encoding: 'utf8' },
      )
      return out
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number)
        .filter((n) => Number.isFinite(n) && n > 0)
    }
    const out = execSync(`lsof -ti tcp:${port} || true`, { encoding: 'utf8' })
    return out
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0)
  } catch {
    return []
  }
}

for (const port of PORTS) {
  const pids = [...new Set(pidsOnPort(port))]
  for (const pid of pids) {
    try {
      process.kill(pid)
      console.log(`[free-ports] stopped pid ${pid} on :${port}`)
    } catch (err) {
      if (err.code !== 'ESRCH') {
        console.warn(`[free-ports] could not stop pid ${pid}: ${err.message}`)
      }
    }
  }
}
