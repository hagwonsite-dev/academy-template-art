import {tmpdir} from 'node:os';
import {join} from 'node:path';
export default {testDir:'./tests',testMatch:'browser.spec.mjs',workers:1,timeout:30000,use:{headless:true,viewport:{width:1440,height:1000}},reporter:'list',outputDir:join(tmpdir(),'onhi-playwright-results')};
