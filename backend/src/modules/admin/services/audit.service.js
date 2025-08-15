const fs = require('fs');
const path = require('path');

async function exportAudit({ format = 'csv' } = {}) {
  // Leer archivo de audit si existe; si no, generar contenido vacío
  const logsDir = path.join(process.cwd(), 'logs');
  const auditFile = path.join(logsDir, 'audit.log');
  let lines = [];
  try {
    if (fs.existsSync(auditFile)) {
      const raw = fs.readFileSync(auditFile, 'utf8');
      lines = raw.split(/\r?\n/).filter(Boolean);
    }
  } catch (_) {}

  const rows = lines.map(line => {
    try {
      const obj = JSON.parse(line.replace(/^.*?\{/, '{'));
      return obj;
    } catch {
      return null;
    }
  }).filter(Boolean);

  if (format === 'excel') {
    // Simple CSV como placeholder para Excel
    format = 'csv';
  }

  const header = ['timestamp','userId','action','entityType','entityId','ip','userAgent'];
  const csv = [header.join(',')].concat(
    rows.map(r => [r.timestamp, r.userId, r.action, r.entityType, r.entityId, r.ip, r.userAgent]
      .map(v => (v == null ? '' : String(v).replace(/,/g,';'))).join(','))
  ).join('\n');

  const buffer = Buffer.from(csv, 'utf8');
  return {
    filename: `audit-${new Date().toISOString().slice(0,10)}.csv`,
    contentType: 'text/csv',
    buffer
  };
}

module.exports = { exportAudit };


