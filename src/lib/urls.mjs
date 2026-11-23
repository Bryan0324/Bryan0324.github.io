import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export function localDate(value, zone = 'Asia/Taipei') {
  if (value instanceof Date) return dayjs(value).tz(zone);
  const text = String(value).trim();
  return /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text)
    ? dayjs(text).tz(zone) : dayjs.tz(text, zone);
}

export function postPath(id, data, config) {
  if (data.permalink) return data.permalink.replace(/^\/+|\/+$/g, '');
  const date = localDate(data.date, config.timezone);
  if (!date.isValid()) throw new Error(`Invalid post date: ${id}`);
  const values = {
    year: date.format('YYYY'), month: date.format('MM'), day: date.format('DD'),
    title: data.slug || id, id,
  };
  return (config.permalink || ':year/:month/:day/:title/')
    .replace(/:(year|month|day|title|id)\b/g, (_, key) => values[key])
    .replace(/^\/+|\/+$/g, '');
}

// Match Hexo's taxonomy URLs, including its punctuation/whitespace handling.
export function slugify(value) {
  return value.replace(/[\s~!@#$%^&*()_+=\[\]{}|\\;:'",.<>/?`]+/g, '-').replace(/^-+|-+$/g, '');
}
export function href(path = '') {
  return '/' + path.split('/').filter(Boolean).map(encodeURIComponent).join('/') + (path && /\.html$/.test(path) ? '' : path ? '/' : '');
}
