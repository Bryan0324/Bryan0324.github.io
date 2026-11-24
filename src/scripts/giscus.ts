export interface GiscusConfig {
  theme?: string;
  loading?: 'lazy' | 'eager';
  [key: string]: string | number | boolean | undefined;
}

export function giscusTheme(config: GiscusConfig, mode: string) {
  return !config.theme || config.theme === 'auto'
    ? mode === 'dark' ? 'transparent_dark' : 'light'
    : config.theme;
}

export function initGiscus(container: HTMLElement, mode: () => string) {
  const config: GiscusConfig = JSON.parse(container.dataset.config!);
  const load = () => {
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    for (const key of ['repo', 'repo-id', 'category', 'category-id', 'mapping', 'term', 'reactions-enabled', 'emit-metadata', 'lang', 'input-position', 'strict', 'loading']) {
      if (config[key] !== undefined) script.setAttribute(`data-${key}`, String(config[key]));
    }
    script.setAttribute('data-theme', giscusTheme(config, mode()));
    container.append(script);
  };
  if (config.loading === 'eager') load();
  else {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      load();
    }, { rootMargin: '200px' });
    observer.observe(container);
  }
  return () => {
    container.querySelector<HTMLIFrameElement>('iframe.giscus-frame')?.contentWindow?.postMessage(
      { giscus: { setConfig: { theme: giscusTheme(config, mode()) } } }, 'https://giscus.app',
    );
  };
}
