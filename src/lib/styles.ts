
export function parseInlineStyles(styleStr: string): Record<string, string> {
  const styles: Record<string, string> = {};
  if (!styleStr) return styles;
  
  styleStr.split(';').forEach(pair => {
    const colonIndex = pair.indexOf(':');
    if (colonIndex > -1) {
      const key = pair.substring(0, colonIndex).trim();
      const value = pair.substring(colonIndex + 1).trim();
      if (key && value) {
        styles[key] = value;
      }
    }
  });
  return styles;
}

export function serializeInlineStyles(styles: Record<string, string>): string {
  return Object.entries(styles)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');
}
