const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "..", "logs");
const logFile = path.join(logDir, "audit.log");

const ensureLogDir = () => {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
};

const formatLocalTimestamp = (date) => {
  const formatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}:${parts.second}`;
};

const logAuditEvent = (event, payload = {}) => {
  try {
    ensureLogDir();
    const entry = {
      timestamp: formatLocalTimestamp(new Date()),
      event,
      ...payload
    };
    fs.appendFileSync(logFile, `${JSON.stringify(entry)}\n`, "utf8");
  } catch (error) {
    console.error("[audit] failed to write audit log", error);
  }
};

module.exports = {
  logAuditEvent
};
