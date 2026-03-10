const fs = require('fs');
const path = require('path');

const constantsPath = path.join(process.cwd(), 'app', 'lib', 'constants.js');
let content = fs.readFileSync(constantsPath, 'utf8');

const files = fs.readdirSync(path.join(process.cwd(), 'app', 'sections'))
    .filter(f => /^cf-.*-(01|13)-v\d+\.liquid$/.test(f));

// Splitting carefully with carriage returns considered
const lines = content.split(/\r?\n/);
const objStartIdx = lines.findIndex(l => l.includes('export const SECTION_FILES = {'));
const objEndIdx = lines.findIndex((l, i) => i > objStartIdx && l.trim() === '};');

if (objEndIdx === -1) {
    console.error('ERROR: Could not find closing brace for SECTION_FILES. Checked lines array length:', lines.length);
    process.exit(1);
}

let insertIdx = objEndIdx;
let newLines = [];
const cats = {
    'head': 'header', 'header': 'header',
    'marquee': 'marquee',
    'promo': 'promo', 'snack': 'snack',
    'cat': 'category', 'category': 'category',
    'feat': 'feature', 'feature': 'feature',
    'trust': 'trust'
};
const nicheNames = { '01': 'Luxury', '13': 'Brand' };
const typeNames = {
    'head': 'Header', 'header': 'Header',
    'marquee': 'Marquee',
    'promo': 'Promo', 'snack': 'Snack',
    'cat': 'Category', 'category': 'Category',
    'feat': 'Featured', 'feature': 'Featured',
    'trust': 'Trust'
};

for (const f of files) {
    const match = f.match(/^cf-(head|header|marquee|promo|snack|cat|category|feat|feature|trust)-(01|13)-(v\d+)\.liquid$/);
    if (!match) continue;

    const pref = match[1];
    const nId = match[2];
    const v = match[3];
    const k = `cf-${pref}-${nId}-${v}`;

    // Skip if already in the file cleanly, though this is a clean restore so everything gets added
    if (content.includes(`'${k}':`)) continue;

    const cat = cats[pref];
    const nName = nicheNames[nId];
    const tName = typeNames[pref];
    const label = `${nId} · ${nName} ${tName} (${v})`;

    newLines.push(`    '${k}': { category: '${cat}', name: '${label.replace(/'/g, "\\'")}', file: '${f}' },`);
}

if (newLines.length > 0) {
    lines.splice(insertIdx, 0, ...newLines);
    fs.writeFileSync(constantsPath, lines.join('\n'));
    console.log(`Successfully added ${newLines.length} missing sections to constants.js right before line ${insertIdx}`);
} else {
    console.log('No new sections to add. They are already present.');
}
