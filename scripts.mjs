import { readFileSync } from 'node:fs';
const c=JSON.parse(readFileSync('src/config.json'));
for(const [name,e] of Object.entries(c.entities)){if(!/^[A-Za-z]+$/.test(name))throw Error('Invalid entity');for(const f of e.fields)if(!/^[A-Za-z]+$/.test(f.name))throw Error('Invalid field');}
console.log('Template configuration lint passed');
