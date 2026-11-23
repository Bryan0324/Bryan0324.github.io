const root = document.documentElement;
const container = document.querySelector('.container')!;
const menu = document.querySelector<HTMLButtonElement>('#menu-btn')!;
const overlay = document.querySelector<HTMLButtonElement>('.sidebar-overlay')!;
const sidebar = document.querySelector<HTMLElement>('#site-sidebar')!;
const mobile = matchMedia('(max-width: 768px)');
function syncSidebar() {
  sidebar.inert = (mobile.matches || document.body.classList.contains('is-home')) && !container.classList.contains('sidebar-open');
}
function setSidebar(open: boolean) {
  container.classList.toggle('sidebar-open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
  syncSidebar();
}
syncSidebar();
mobile.addEventListener('change', syncSidebar);
menu.addEventListener('click', () => setSidebar(!container.classList.contains('sidebar-open')));
overlay.addEventListener('click', () => setSidebar(false));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setSidebar(false); });
document.querySelectorAll<HTMLButtonElement>('[data-panel]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-panel]').forEach((tab) => {
      tab.classList.toggle('sidebar-nav-active', tab === button);
      tab.setAttribute('aria-pressed', String(tab === button));
    });
    document.querySelectorAll('.sidebar-panel').forEach((panel) => panel.classList.toggle('sidebar-panel-active', panel.id === button.dataset.panel));
  });
});

const modes = ['light', 'sunset', 'dark'];
const currentMode = () => root.classList.contains('dark') ? 'dark' : root.classList.contains('sunset') ? 'sunset' : 'light';
function syncComments() {
  document.querySelector<HTMLIFrameElement>('iframe.giscus-frame')?.contentWindow?.postMessage({ giscus: { setConfig: { theme: currentMode() === 'dark' ? 'transparent_dark' : 'light' } } }, 'https://giscus.app');
}
function applyMode(mode: string) {
  root.classList.remove('dark', 'sunset');
  if (mode !== 'light') root.classList.add(mode);
  syncComments();
}
document.querySelector('#toggle-mode-btn')?.addEventListener('click', () => {
  const mode = modes[(modes.indexOf(currentMode()) + 1) % modes.length];
  try { localStorage.setItem('darken-mode', mode); } catch {}
  applyMode(mode);
});
function automaticMode() {
  try { if (modes.includes(localStorage.getItem('darken-mode') || '')) return; } catch {}
  if (root.dataset.mode === 'auto') applyMode(matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (root.dataset.mode === 'time') {
    const h = new Date().getHours();
    applyMode(h >= 20 || h < 7 ? 'dark' : h >= 17 ? 'sunset' : 'light');
  }
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', automaticMode);
if (root.dataset.mode === 'time') setInterval(automaticMode, 60_000);

const comments = document.querySelector<HTMLElement>('#giscus');
if (comments) {
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    const config = JSON.parse(comments.dataset.config!);
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    for (const key of ['repo', 'repo-id', 'category', 'category-id', 'mapping', 'reactions-enabled', 'emit-metadata', 'lang', 'input-position', 'strict']) {
      if (config[key] !== undefined) script.setAttribute(`data-${key}`, String(config[key]));
    }
    script.setAttribute('data-theme', currentMode() === 'dark' ? 'transparent_dark' : 'light');
    comments.append(script);
  }, { rootMargin: '200px' });
  observer.observe(comments);
}

interface SearchEntry { title: string; url: string; content: string; tags: string[]; }
const dialog = document.querySelector<HTMLDialogElement>('#search-dialog');
if (dialog) {
  const input = dialog.querySelector<HTMLInputElement>('#search-input')!;
  const status = dialog.querySelector<HTMLElement>('#search-status')!;
  const results = dialog.querySelector<HTMLUListElement>('#search-results')!;
  let index: Promise<SearchEntry[]> | undefined;
  let request = 0;
  document.querySelectorAll('[data-search-open]').forEach((button) => button.addEventListener('click', () => { dialog.showModal(); input.focus(); }));
  dialog.querySelector('[data-search-close]')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  input.addEventListener('input', async () => {
    const generation = ++request;
    const query = input.value.trim().toLocaleLowerCase();
    results.replaceChildren();
    if (!query) { status.textContent = '輸入關鍵字搜尋標題與內文'; return; }
    status.textContent = '搜尋中…';
    try {
      index ??= fetch('/search.json').then((response) => {
        if (!response.ok) throw new Error('Search index unavailable');
        return response.json();
      });
      const entries = await index;
      if (generation !== request) return;
      const terms = query.split(/\s+/);
      const matches = entries.filter((post) => terms.every((term) => `${post.title} ${post.content} ${post.tags.join(' ')}`.toLocaleLowerCase().includes(term)));
      status.textContent = matches.length ? `找到 ${matches.length} 篇文章` : '沒有找到相關文章';
      for (const post of matches) {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = post.url;
        link.textContent = post.title;
        const excerpt = document.createElement('p');
        const offset = Math.max(0, post.content.toLocaleLowerCase().indexOf(terms[0]) - 35);
        excerpt.textContent = `${offset ? '…' : ''}${post.content.slice(offset, offset + 180)}…`;
        li.append(link, excerpt);
        results.append(li);
      }
    } catch {
      index = undefined;
      if (generation === request) status.textContent = '搜尋資料載入失敗，請稍後再試';
    }
  });
}

document.querySelectorAll<HTMLElement>('.markdown-body pre').forEach((pre) => {
  const code = pre.querySelector('code');
  if (!code) return;
  const button = document.createElement('button');
  button.className = 'copy-code';
  button.textContent = '複製';
  button.setAttribute('aria-label', '複製程式碼');
  button.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(code.textContent || ''); button.textContent = '已複製'; }
    catch { button.textContent = '複製失敗'; }
    setTimeout(() => { button.textContent = '複製'; }, 2000);
  });
  pre.append(button);
});

const headings = document.querySelectorAll<HTMLElement>('.post-content :is(h1,h2,h3,h4,h5,h6)[id]');
if (headings.length) {
  const observer = new IntersectionObserver((entries) => {
    const active = entries.find((entry) => entry.isIntersecting);
    if (!active) return;
    document.querySelectorAll<HTMLAnchorElement>('.astro-toc a').forEach((link) => link.classList.toggle('active', decodeURIComponent(link.hash.slice(1)) === active.target.id));
  }, { rootMargin: '0px 0px -65% 0px' });
  headings.forEach((heading) => observer.observe(heading));
}

const uptime = document.querySelector<HTMLElement>('#live-time');
if (uptime) {
  const start = new Date(uptime.dataset.start! + (/(?:Z|[+-]\d\d:\d\d)$/.test(uptime.dataset.start!) ? '' : '+08:00')).valueOf();
  const update = () => {
    const elapsed = Math.max(0, Math.floor((Date.now() - start) / 1000));
    uptime.textContent = `${Math.floor(elapsed / 86400)} 天 ${Math.floor(elapsed / 3600) % 24} 時 ${Math.floor(elapsed / 60) % 60} 分 ${elapsed % 60} 秒`;
  };
  update();
  setInterval(update, 1000);
}

if (document.body.dataset.mermaid === 'true' && document.querySelector('.mermaid')) {
  import('mermaid').then(async ({ default: mermaid }) => {
    mermaid.initialize({ startOnLoad: false, theme: currentMode() === 'dark' ? 'dark' : 'default', securityLevel: 'strict' });
    await mermaid.run({ querySelector: '.mermaid' });
  }).catch(console.error);
}
if (document.body.dataset.reveal === 'true' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
      entry.target.animate([{ opacity: 0, transform: 'translateY(20px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 500, easing: 'ease-out' });
      observer.unobserve(entry.target);
    });
  });
  document.querySelectorAll('.post-card, .markdown-body img').forEach((element) => observer.observe(element));
}
if (document.body.dataset.fireworks && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const colors: string[] = JSON.parse(document.body.dataset.fireworks);
  document.addEventListener('click', (event) => {
    if (!event.detail) return;
    for (let i = 0; i < 10; i++) {
      const dot = document.createElement('i');
      dot.className = 'click-particle';
      dot.style.cssText = `left:${event.clientX}px;top:${event.clientY}px;background:rgb(${colors[i % colors.length]})`;
      document.body.append(dot);
      const angle = Math.random() * Math.PI * 2;
      const distance = 20 + Math.random() * 70;
      dot.animate([{ transform: 'translate(-50%, -50%)', opacity: 1 }, { transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`, opacity: 0 }], { duration: 600 + Math.random() * 400, easing: 'ease-out' }).onfinish = () => dot.remove();
    }
  });
}
