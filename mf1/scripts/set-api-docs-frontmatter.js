const { readdir, readFile, writeFile } = require('fs/promises');
const { extname, resolve } = require('path');

const apiDocsDir = process.argv[2];
if (!apiDocsDir) throw new Error('Expected docs dir as CLI arg');

const API_TITLE = 'API Reference';

async function main() {
  for (const fn of await readdir(apiDocsDir)) {
    if (extname(fn) !== '.md') continue;
    const filepath = resolve(apiDocsDir, fn);
    const src = await readFile(filepath, 'utf-8');

    const bc0 = src.indexOf('[Home](./index.md)');
    const bc1 = src.indexOf('\n', bc0);
    const bc = src.substring(bc0, bc1).split(/ &gt; /);
    if (bc0 === -1 || bc1 === -1 || bc1 < bc0 || bc.length === 0) {
      throw new Error(`Failed to parse breadcrumbs for ${fn}`);
    }

    const navpath = bc.map(md => md.match(/^\[(.*)][^\]]*$/)[1]);

    let title = navpath[navpath.length - 1];
    const head = [];
    switch (navpath.length) {
      case 1:
        title = API_TITLE;
        head.push('has_children: true', 'has_toc: false');
        break;
      case 2:
        head.push(
          `parent: ${API_TITLE}`,
          'has_children: true',
          'has_toc: false'
        );
        break;
      case 3:
        head.push(
          `parent: ${JSON.stringify(navpath[1])}`,
          `grand_parent: ${API_TITLE}`
        );
        break;
      default:
        title = navpath.slice(2).join(' / ');
        head.push(
          `parent: ${JSON.stringify(navpath[1])}`,
          `grand_parent: ${API_TITLE}`,
          'nav_exclude: true'
        );
    }
    head.unshift(`title: ${JSON.stringify(title)}`);

    const headStr = `---\n${head.join('\n')}\n---\n\n`;

    const body = src
      .replace(/\[Home]\(\.\/index\.md\).*\n*/, '')
      .replace('## ', '# ');

    await writeFile(filepath, headStr + body);
  }
}

main();
