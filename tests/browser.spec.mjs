import {test,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {readFileSync} from 'node:fs';
const profiles=[JSON.parse(readFileSync('src/config.json','utf8'))];
for(const profile of profiles) test(profile.id+' desktop, mobile and writable workflow',async({browser})=>{
 const dir=await mkdtemp(join(tmpdir(),'academy-ui-'));let child;
 try {
  const env={...process.env,PORT:'4319',APP_PASSWORD:'browser-verification-only',DATABASE_FILE:join(dir,'app.sqlite')};delete env.TURSO_DATABASE_URL;delete env.DATABASE_URL;delete env.READ_ONLY;delete env.PUBLIC_DEMO;
  child=spawn(process.execPath,['--experimental-strip-types','src/server.ts'],{cwd:process.cwd(),env,stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server timeout')),10000);child.once('exit',code=>{clearTimeout(timer);reject(Error('Server exited '+code));});child.stdout.on('data',chunk=>{if(String(chunk).includes('Academy listening')){clearTimeout(timer);resolve();}});});
  const context=await browser.newContext({httpCredentials:{username:'admin',password:'browser-verification-only'},viewport:{width:1440,height:1000}}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4319');await expect(page.locator('h1')).toHaveText(profile.tagline);await expect(page.locator('.metric')).toHaveCount(4);
  await mkdir(join(tmpdir(),'onhi-preview'),{recursive:true});await page.screenshot({path:join(tmpdir(),'onhi-preview',profile.slug+'-desktop.png'),fullPage:true});
  for(const [id,e]of Object.entries(profile.entities)){await page.locator(`nav button[data-feature="${id}"]`).click();await expect(page.locator('.section-heading h2')).toHaveText(e.label);await expect(page.locator('#content')).toHaveAttribute('aria-busy','false');}
  await page.locator('nav button[data-feature="Student"]').click();await page.getByRole('button',{name:'+ 새로 등록'}).click();await page.getByLabel('이름',{exact:true}).fill('브라우저 확인');await page.getByRole('button',{name:'저장하기'}).click();await expect(page.getByRole('cell',{name:'브라우저 확인',exact:true})).toBeVisible();
  await page.getByRole('searchbox').fill('없는이름');await expect(page.locator('.empty')).toBeVisible();await page.getByRole('searchbox').fill('브라우저');await expect(page.getByRole('cell',{name:'브라우저 확인',exact:true})).toBeVisible();
  for(const [id,entity] of Object.entries(profile.entities).filter(([,e])=>e.fields.some(f=>f.relation))){
   await page.locator(`nav button[data-feature="${id}"]`).click();await expect(page.locator('.section-heading h2')).toHaveText(entity.label);await page.getByRole('button',{name:'+ 새로 등록'}).click();await expect(page.locator('#editor')).toBeVisible();
   for(const field of entity.fields.filter(f=>!f.readOnly)){
    const input=page.locator('#form-fields [name="'+field.name+'"]');
    if(field.relation==='Student')await input.selectOption({label:'김하늘'});
    else if(field.relation)await input.selectOption({index:1});
    else if(field.type==='number')await input.fill('1');
    else if(field.type==='date')await input.fill('2026-10-11');
    else if(field.type==='time')await input.fill('15:00');
    else if(field.type!=='url')await input.fill('브라우저 '+field.label);
   }
   await page.getByRole('button',{name:'저장하기'}).click();await expect(page.locator('#editor')).not.toBeVisible();await expect(page.locator('#content')).toHaveAttribute('aria-busy','false');
  }
  await page.locator('nav button[data-feature="overview"]').click();await page.setViewportSize({width:390,height:844});await expect(page.locator('h1')).toHaveText(profile.tagline);await page.screenshot({path:join(tmpdir(),'onhi-preview',profile.slug+'-mobile.png'),fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(errors).toEqual([]);await context.close();
 }finally{if(child&&child.exitCode===null){child.kill('SIGTERM');await new Promise(resolve=>child.once('exit',resolve));}await rm(dir,{recursive:true,force:true});}
});
