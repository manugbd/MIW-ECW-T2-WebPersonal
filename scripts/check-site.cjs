// Comprobaciones de la salida generada. No sustituye a los validadores W3C.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {parseDocument, Parser} = require('htmlparser2');
const {routes, locales, strings} = require('../src/_data/i18n');
const site = require('../src/_data/site');
const prefix = (process.env.ELEVENTY_PATH_PREFIX || '/').replace(/\/$/, '');
const absolute = route => new URL(route.replace(/^\//, ''), site.url + '/').href;
const all = (node, predicate) => (predicate(node) ? [node] : []).concat((node.children || []).flatMap(child => all(child, predicate)));
const elements = doc => all(doc, node => !!node.attribs);
const text = node => node.type === 'text' ? node.data : (node.children || []).map(text).join('');
const output = route => path.join(__dirname, '../public', route.endsWith('/') ? route + 'index.html' : route);
const docs = new Map();
let links = 0;
for (const [key, variants] of Object.entries(routes)) for (const locale of locales) {
  const route = variants[locale.code];
  const html = fs.readFileSync(output(route), 'utf8');
  // Detectar cierres implícitos inesperados; todos los elementos de estas plantillas tienen cierre explícito.
  const voids = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  const parser = new Parser({onclosetag(name, implied) {
    assert(!implied || voids.has(name), route + ': cierre HTML inesperado de ' + name);
  }});
  parser.end(html);
  const doc = parseDocument(html);
  docs.set(route, doc);
  const nodes = elements(doc);
  assert.equal(nodes.find(n => n.name === 'html').attribs.lang, locale.code, route);
  assert.equal(nodes.filter(n => n.name === 'h1').length, 1, route + ': h1');
  assert(!html.includes('{{') && !html.includes('{%'), route + ': plantilla sin renderizar');
  assert(!nodes.some(n => n.name === 'div'), route + ': div');
  const ids = nodes.filter(n => n.attribs.id).map(n => n.attribs.id);
  assert.equal(new Set(ids).size, ids.length, route + ': identificadores duplicados');
  for (const n of nodes) {
    if (n.name === 'img') assert('alt' in n.attribs, route + ': imagen sin alt');
    assert(!n.attribs.tabindex || Number(n.attribs.tabindex) <= 0, route + ': tabindex positivo');
    for (const attribute of ['aria-labelledby', 'aria-describedby', 'aria-controls']) if(n.attribs[attribute]) {
      for (const id of n.attribs[attribute].split(/\s+/)) assert(ids.includes(id), route + ': ' + attribute + ' ' + id);
    }
  }
  const picker = nodes.find(n => n.name === 'details' && 'data-language' in n.attribs);
  const choices = elements(picker).filter(n => n.name === 'a');
  assert.equal(choices.length, 3);
  for (const language of locales) {
    const choice = choices.find(n => n.attribs.hreflang === language.code);
    assert.equal(choice.attribs.href, prefix + routes[key][language.code], route + ': idioma equivalente');
    assert.equal(choice.attribs.lang, language.code);
    assert.equal(!!choice.attribs['aria-current'], language.code === locale.code);
  }
  const status = nodes.find(n => 'data-copy-status' in n.attribs);
  assert.equal(status.attribs['data-copy-error'], strings[locale.code].copyError);
  const navigation = nodes.find(n => n.attribs.id === 'navegacion-principal');
  for (const link of elements(navigation).filter(n => n.name === 'a')) {
    assert(Object.values(routes).some(v => prefix + v[locale.code] === link.attribs.href), route + ': navegación en otro idioma');
  }
  if (site.url && key !== 'notFound') {
    const canonical = nodes.find(n => n.attribs.rel === 'canonical');
    assert.equal(canonical.attribs.href, absolute(route));
    const alternates = nodes.filter(n => n.name === 'link' && n.attribs.hreflang);
    assert.equal(alternates.length, 4);
    for (const language of locales) assert.equal(alternates.find(n => n.attribs.hreflang === language.code).attribs.href, absolute(variants[language.code]));
    const json = JSON.parse(text(nodes.find(n => n.name === 'script' && n.attribs.type === 'application/ld+json')));
    const page = json['@graph'].find(n => n['@type'] === (key === 'profile' ? 'ProfilePage' : 'WebPage'));
    assert.equal(page.inLanguage, locale.code);
    assert.equal(page.url, absolute(route));
  }
}
for (const [route, doc] of docs) for (const node of elements(doc)) for(const attribute of ['href','src']) {
  const ref = node.attribs[attribute];
  if(!ref || /^(https?:|mailto:|tel:|data:)/.test(ref)) continue;
  const url = new URL(ref, 'https://local.test' + prefix + route);
  let pathname = decodeURIComponent(url.pathname);
  assert(!prefix || pathname.startsWith(prefix + '/'), route + ': prefijo perdido ' + ref);
  if(prefix) pathname = pathname.slice(prefix.length);
  assert(fs.existsSync(output(pathname)), route + ': destino inexistente ' + ref);
  if(url.hash) {
    const target = docs.get(pathname) || parseDocument(fs.readFileSync(output(pathname), 'utf8'));
    assert(elements(target).some(n => n.attribs.id === decodeURIComponent(url.hash.slice(1))), route + ': ancla ' + ref);
  }
  links++;
}
if(site.url) {
  const sitemap = parseDocument(fs.readFileSync(path.join(__dirname, '../public/sitemap.xml'), 'utf8'), {xmlMode:true});
  const entries = elements(sitemap).filter(n => n.name === 'url');
  assert.equal(entries.length, 15, 'Sitemap: 15 páginas indexables');
  const expected = Object.entries(routes).filter(([key]) => key !== 'notFound').flatMap(([,variants]) => Object.values(variants).map(absolute));
  for(const entry of entries) {
    const url = text(elements(entry).find(n => n.name === 'loc'));
    assert(expected.includes(url), 'Sitemap: URL incorrecta ' + url);
    assert.equal(elements(entry).filter(n => n.name === 'xhtml:link').length,4);
  }
}
console.log(docs.size + ' páginas, ' + links + ' referencias internas, idiomas, ARIA, selector y metadatos correctos.');
