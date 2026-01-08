function extractManifest(raw, { filePath } = {}) {
  // Allow BOM / leading whitespace, but require manifest at top "area".
  const trimmedStart = raw.replace(/^\uFEFF/, "");
  const firstNonWs = trimmedStart.search(/[^\s]/);
  const start = trimmedStart.indexOf("<!-- @cmp-manifest", firstNonWs >= 0 ? firstNonWs : 0);
  if (start !== firstNonWs) {
    throw new Error(`Missing or not-top @cmp-manifest${filePath ? `: ${filePath}` : ""}`);
  }
  const end = trimmedStart.indexOf("-->", start);
  if (end < 0) throw new Error(`Unclosed @cmp-manifest${filePath ? `: ${filePath}` : ""}`);

  const head = "<!-- @cmp-manifest";
  const jsonText = trimmedStart.slice(start + head.length, end).trim();
  let manifest;
  try {
    manifest = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`Invalid manifest JSON${filePath ? `: ${filePath}` : ""}: ${e.message}`);
  }
  return { manifest, manifestRange: { start, end: end + 3 } };
}

module.exports = { extractManifest };


