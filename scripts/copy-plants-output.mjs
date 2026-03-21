/**
 * Zkopíruje generovaný výstup do public/plants-output.html (záložní URL pro SPA),
 * pokud nasazujete jen složku public a nemáte k dispozici ../Filtrování rostlin/.
 *
 * Spuštění z kořene repozitáře: node scripts/copy-plants-output.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'Filtrování rostlin', 'output.html');
const dst = path.join(root, 'public', 'plants-output.html');
fs.copyFileSync(src, dst);
console.log('OK', dst);
