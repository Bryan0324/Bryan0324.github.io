import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const readYaml = (path) => parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
function merge(base, override) {
  const result = { ...base };
  for (const [key, value] of Object.entries(override ?? {})) {
    result[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? merge(base?.[key] ?? {}, value) : value;
  }
  return result;
}

// Keep the existing, documented configuration as the theme's public interface.
export const site = readYaml('../../_config.yml');
export const theme = merge(
  readYaml('../../themes/yun/_config.yml'),
  readYaml('../../_config.yun.yml'),
);
