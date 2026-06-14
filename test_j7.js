import { getScreenItems } from './src/config/pathway.config.js';
const items = getScreenItems('J7');
console.log(items.map(i => ({id: i.id, req: i.required !== false && i.type !== 'text' && i.type !== 'verbatim'})));
