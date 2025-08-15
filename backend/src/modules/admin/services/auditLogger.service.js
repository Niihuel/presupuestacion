const fs = require('fs');
const path = require('path');

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
const auditFile = path.join(logsDir, 'audit.log');

function write(entry) {
  const line = JSON.stringify(entry);
  fs.appendFile(auditFile, line + '\n', () => {});
}

function logLogin({ userId, username, ip, userAgent }) {
  write({
    type: 'login',
    userId,
    username,
    ip,
    userAgent,
    timestamp: new Date().toISOString()
  });
}

module.exports = { logLogin };
// Utilidades para CRUD
function logCrud({ userId, entity, entityId, action, data }) {
  write({
    type: 'crud',
    action, // create|update|delete
    entity, // projects|quotations|materials
    entityId,
    userId,
    data: data || null,
    timestamp: new Date().toISOString()
  });
}

module.exports.logCrud = logCrud;


