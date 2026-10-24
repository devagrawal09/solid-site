import { writeFile, readdir, readFile } from 'fs/promises';

const routes = [
  '/',
  '/docs',
  '/contributors',
  '/ecosystem',
  '/resources',
  '/media',
  '/store',
  '/blog',
];
const site_url = 'https://www.solidjs.com';

function formatPage(name, published) {
  return `\n  <url>\n    <loc>${name}</loc>\n    <lastmod>${published}</lastmod>\n  </url>`;
}

async function generateSitemap() {
  const publishDate = new Date().toISOString();
  let content = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  routes.forEach((route) => {
    content = `${content}${formatPage(`${site_url}${route}`, publishDate)}`;
  });

  const examples = await readdir('public/examples');
  examples.forEach((route) => {
    const path = `${site_url}/examples/${route.replace('.json', '')}`;
    content = `${content}${formatPage(path, publishDate)}`;
  });

  const tutorialLookup = JSON.parse(await readFile('src/content/tutorials/directory.json', 'utf8'));
  const lessons = tutorialLookup.map((lookup) => lookup.internalName);
  lessons.forEach((route) => {
    const path = `${site_url}/tutorial/${route}`;
    content = `${content}${formatPage(path, publishDate)}`;
  });

  content = `${content}\n</urlset>\n`;
  await writeFile('public/sitemap.xml', content, { encoding: 'utf-8' });
}

generateSitemap().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
