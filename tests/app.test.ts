import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validate} from '../src/app.ts';
import {readFileSync} from 'node:fs';
const config=JSON.parse(readFileSync('src/config.json','utf8'));
test('requires a student name and rejects unknown fields',()=>{assert.throws(()=>validate(config.entities.Student.fields,{}));assert.equal(validate(config.entities.Student.fields,{name:'학생'}).name,'학생');assert.throws(()=>validate(config.entities.Student.fields,{name:'학생',admin:true}));});
