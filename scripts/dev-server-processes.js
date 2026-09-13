import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const SERVER_MARKER = '--etherforge-ascii-dev-server';

export function devServerPidFile(projectRoot, port) {
  const projectId = createHash('sha256').update(projectRoot).digest('hex').slice(0, 12);
  return join(tmpdir(), `etherforge-ascii-${projectId}-${Number(port)}.pid`);
}

export function stopRecordedDevServer(pidFile, currentPid = process.pid) {
  if (!existsSync(pidFile)) return false;
  try {
    const previousPid = Number(readFileSync(pidFile, 'utf8'));
    if (Number.isInteger(previousPid) && previousPid > 0 && previousPid !== currentPid) {
      process.kill(previousPid, 'SIGTERM');
    }
  } catch (error) {
    if (error.code !== 'ESRCH') return false;
  }
  try { unlinkSync(pidFile); } catch {}
  return true;
}

export function recordDevServer(pidFile, currentPid = process.pid) {
  writeFileSync(pidFile, String(currentPid), 'utf8');
}

export function clearDevServerRecord(pidFile, currentPid = process.pid) {
  try {
    if (Number(readFileSync(pidFile, 'utf8')) === currentPid) unlinkSync(pidFile);
  } catch {}
}

export function buildWindowsCleanupScript(port, currentPid) {
  return '$ErrorActionPreference = "SilentlyContinue"; ' +
    '$owners = @(Get-NetTCPConnection -State Listen -LocalPort ' + Number(port) +
    ' | Select-Object -ExpandProperty OwningProcess); ' +
    '$targets = Get-CimInstance Win32_Process | Where-Object { ' +
    '$_.ProcessId -ne ' + Number(currentPid) +
    ' -and $_.Name -match "^node(\\.exe)?$" -and (' +
    '$_.CommandLine -like "*' + SERVER_MARKER + '*" -or (' +
    '$owners -contains $_.ProcessId -and $_.CommandLine -like "*scripts/dev-server.js*")) }; ' +
    '$targets | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }';
}

export function stopOtherDevServers({ port, currentPid = process.pid, platform = process.platform } = {}) {
  if (platform !== 'win32') return 0;
  const script = buildWindowsCleanupScript(port, currentPid);
  try {
    execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
      stdio: 'ignore',
      windowsHide: true,
      timeout: 8000
    });
    return 0;
  } catch (error) {
    return error.status ?? 1;
  }
}
