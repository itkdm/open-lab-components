const levels = {
  error: 0,
  info: 1,
  debug: 2
};

function sizeBucket(bytes) {
  if (!bytes) return "none";
  if (bytes < 1024) return "xs";
  if (bytes < 10 * 1024) return "sm";
  if (bytes < 100 * 1024) return "md";
  return "lg";
}

function createLogger(level = "info") {
  const current = levels[level] ?? levels.info;

  function write(kind, payload) {
    if ((levels[kind] ?? levels.info) > current) return;
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      level: kind,
      ...payload
    });
    process.stdout.write(`${line}\n`);
  }

  return {
    info(payload) {
      write("info", payload);
    },
    error(payload) {
      write("error", payload);
    },
    debug(payload) {
      write("debug", payload);
    },
    sizeBucket
  };
}

export { createLogger, sizeBucket };
