import fs from 'fs';
import path from 'path';

const SRC = "c:/Users/owner/Downloads/eternal-theme";
const DEST = "c:/Users/owner/shopify app/convertflow-ai/app";

function copyDir(src, dest, ext) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

    // clear dest
    const existing = fs.readdirSync(dest);
    for (const file of existing) {
        fs.unlinkSync(path.join(dest, file));
    }

    const files = fs.readdirSync(src);
    let count = 0;
    const copiedFiles = [];
    for (const file of files) {
        if (ext && !file.endsWith(ext) && !file.endsWith('.json')) continue;
        const srcPath = path.join(src, file);
        if (fs.statSync(srcPath).isDirectory()) continue;

        fs.copyFileSync(srcPath, path.join(dest, file));
        if (!file.endsWith('.json')) copiedFiles.push(file);
        count++;
    }
    console.log(`Copied ${count} files to ${dest}`);
    return copiedFiles;
}

console.log("Starting theme extraction...");

copyDir(path.join(SRC, 'snippets'), path.join(DEST, 'theme-deps', 'snippets'), '.liquid');
copyDir(path.join(SRC, 'locales'), path.join(DEST, 'theme-deps', 'locales'), '.json');
const sections = copyDir(path.join(SRC, 'sections'), path.join(DEST, 'sections'), '.liquid');

console.log("\nGenerating constants.js section mapping...");

let output = `export const SECTION_FILES = {\n`;
for (const file of sections) {
    const id = file.replace('.liquid', '');
    let name = id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    let cat = 'content';
    if (id.includes('header')) cat = 'header';
    else if (id.includes('footer')) cat = 'footer';
    else if (id.includes('product')) cat = 'product';
    else if (id.includes('collection')) cat = 'collection';
    else if (id.includes('banner') || id.includes('hero') || id.includes('slide')) cat = 'hero';
    else if (id.includes('testimonial') || id.includes('review')) cat = 'testimonial';
    else if (id.includes('instagram') || id.includes('tiktok') || id.includes('social')) cat = 'social';
    else if (id.includes('video')) cat = 'video';
    else if (id.includes('brand') || id.includes('service')) cat = 'brand';
    else if (id.includes('newsletter')) cat = 'newsletter';
    else if (id.includes('faq') || id.includes('polic')) cat = 'faq';
    else if (id.includes('marquee') || id.includes('spotlight')) cat = 'banner';

    output += `    '${id}': { category: '${cat}', name: '${name}', file: '${file}' },\n`;
}
output += `};\n`;

fs.writeFileSync(path.join(DEST, 'new_constants_map.js'), output);
console.log("Done. Wrote mapping to app/new_constants_map.js");
