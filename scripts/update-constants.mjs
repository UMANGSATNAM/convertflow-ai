import fs from 'fs';
import path from 'path';

const file = 'c:/Users/owner/shopify app/convertflow-ai/app/lib/constants.js';
const mapFile = 'c:/Users/owner/shopify app/convertflow-ai/app/new_constants_map.js';

let constantsContent = fs.readFileSync(file, 'utf8');
const newMap = fs.readFileSync(mapFile, 'utf8');

// Replace the SECTION_FILES block
const regex = /export const SECTION_FILES = \{[\s\S]*?\n\};\n/;
constantsContent = constantsContent.replace(regex, newMap + '\n');

fs.writeFileSync(file, constantsContent, 'utf8');
console.log("Updated constants.js with new 146 section mapping.");
