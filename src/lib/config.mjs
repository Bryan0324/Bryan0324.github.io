import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import themeDefaults from './theme-defaults.mjs';

const readYaml = (path) => parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
function merge(base, override) {
  const result = { ...base };
  for (const [key, value] of Object.entries(override ?? {})) {
    result[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? merge(base?.[key] ?? {}, value) : value;
  }
  return result;
}

// Site settings and theme overrides share one user-facing configuration file.
const { theme: themeOverrides = {}, ...siteConfig } = readYaml('../../_config.yml');
export const site = siteConfig;
export const theme = merge(
  themeDefaults,
  themeOverrides,
);
