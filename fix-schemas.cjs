/**
 * fix-schemas.cjs
 * 
 * Batch fix script that processes ALL .liquid section files:
 * 1. Shortens schema "name" fields to 25 characters max (Shopify limit)
 * 2. Strips ALL "t:" translation references and replaces with plain English
 * 3. Reports all changes made
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'app', 'sections');
const MAX_NAME = 25;

function fixTranslationRef(str) {
    // "t:sections.foo.bar.label" -> "Bar"
    const parts = str.replace(/^t:/, '').split('.');
    let last = parts[parts.length - 1];
    if ((last === 'label' || last === 'info' || last === 'title' || last === 'name') && parts.length > 1) {
        last = parts[parts.length - 2];
    }
    return last.replace(/_/g, ' ').replace(/^./, s => s.toUpperCase());
}

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.liquid'));
let totalFixed = 0;

files.forEach(file => {
    const fp = path.join(DIR, file);
    let content = fs.readFileSync(fp, 'utf8');
    let modified = false;
    const changes = [];

    // ─── 1. Fix "t:" references anywhere in the file ───
    const tRegex = /"(t:[^"]+)"/g;
    if (tRegex.test(content)) {
        content = content.replace(/"(t:[^"]+)"/g, (match, ref) => {
            const fixed = fixTranslationRef(ref);
            changes.push(`  t: "${ref}" -> "${fixed}"`);
            return `"${fixed}"`;
        });
        modified = true;
    }

    // ─── 2. Fix schema name length ───
    const schemaStart = content.indexOf('{% schema %}');
    const schemaEnd = content.indexOf('{% endschema %}');
    
    if (schemaStart !== -1 && schemaEnd !== -1) {
        const before = content.substring(0, schemaStart + '{% schema %}'.length);
        const schemaStr = content.substring(schemaStart + '{% schema %}'.length, schemaEnd).trim();
        const after = content.substring(schemaEnd);
        
        try {
            const schema = JSON.parse(schemaStr);
            
            if (schema.name && schema.name.length > MAX_NAME) {
                const oldName = schema.name;
                // Smart truncation: try to keep meaningful words
                let shortened = schema.name;
                
                // Remove common prefixes like "CRO · " to save space, then re-add shorter version
                shortened = shortened
                    .replace('CRO · ', '')
                    .replace('CF · ', '');
                
                if (shortened.length > MAX_NAME) {
                    shortened = shortened.substring(0, MAX_NAME);
                }
                
                // If still too long after removing prefix, just hard truncate
                if (shortened.length > MAX_NAME) {
                    shortened = shortened.substring(0, MAX_NAME);
                }
                
                schema.name = shortened;
                changes.push(`  name: "${oldName}" (${oldName.length}ch) -> "${shortened}" (${shortened.length}ch)`);
                
                content = before + '\n' + JSON.stringify(schema, null, 2) + '\n' + after;
                modified = true;
            }
            
            // Also fix any name fields in settings that use t: refs
            if (schema.settings) {
                schema.settings.forEach(setting => {
                    if (setting.label && typeof setting.label === 'string' && setting.label.startsWith('t:')) {
                        const old = setting.label;
                        setting.label = fixTranslationRef(old);
                        changes.push(`  setting label: "${old}" -> "${setting.label}"`);
                        modified = true;
                    }
                    if (setting.info && typeof setting.info === 'string' && setting.info.startsWith('t:')) {
                        const old = setting.info;
                        setting.info = fixTranslationRef(old);
                        changes.push(`  setting info: "${old}" -> "${setting.info}"`);
                        modified = true;
                    }
                });
                
                if (modified) {
                    content = before + '\n' + JSON.stringify(schema, null, 2) + '\n' + after;
                }
            }
            
            // Fix preset names too
            if (schema.presets) {
                schema.presets.forEach(preset => {
                    if (preset.name && preset.name.length > MAX_NAME) {
                        const old = preset.name;
                        preset.name = preset.name.replace('CRO · ', '').replace('CF · ', '');
                        if (preset.name.length > MAX_NAME) preset.name = preset.name.substring(0, MAX_NAME);
                        changes.push(`  preset: "${old}" -> "${preset.name}"`);
                        modified = true;
                    }
                    if (preset.name && typeof preset.name === 'string' && preset.name.startsWith('t:')) {
                        const old = preset.name;
                        preset.name = fixTranslationRef(old);
                        changes.push(`  preset name: "${old}" -> "${preset.name}"`);
                        modified = true;
                    }
                });
                
                if (modified) {
                    content = before + '\n' + JSON.stringify(schema, null, 2) + '\n' + after;
                }
            }
        } catch (e) {
            // Schema might not be pure JSON (could have Liquid), skip deep parse
        }
    }

    if (modified) {
        fs.writeFileSync(fp, content, 'utf8');
        totalFixed++;
        console.log(`FIXED: ${file}`);
        changes.forEach(c => console.log(c));
    }
});

console.log(`\nDone! Fixed ${totalFixed} of ${files.length} files.`);
