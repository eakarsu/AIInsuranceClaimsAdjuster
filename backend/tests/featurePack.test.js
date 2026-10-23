'use strict';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-test-secret-1234567890';
delete process.env.OPENROUTER_API_KEY; delete process.env.OPENAI_API_KEY;
const test = require('node:test'); const assert = require('node:assert/strict');
const express = require('express');
const { createFeaturePackRouter, filterRecords, toCSV, runAI } = require('../routes/featurePack');
delete process.env.OPENROUTER_API_KEY; delete process.env.OPENAI_API_KEY;
const fakeAuth = (req,res,next)=>{ if(!req.headers.authorization) return res.status(401).json({error:'Access token required'}); req.user={id:7}; next(); };
async function withServer(fn){ const app=express(); app.use(express.json()); app.use('/api/feature-pack', createFeaturePackRouter({authenticate:fakeAuth, queryMain: async()=>[{id:1,name:'Alpha',status:'open',wait_time:0,flagged:false},{id:2,name:'Beta',status:'closed',wait_time:30,flagged:true}]})); const s=app.listen(0); try{ await fn('http://127.0.0.1:'+s.address().port); } finally { s.close(); } }
test('tasks require auth and support create/list/update', async ()=>{ await withServer(async(base)=>{
  assert.equal((await fetch(base+'/api/feature-pack/tasks')).status, 401);
  const H={authorization:'Bearer x','content-type':'application/json'};
  const c=await fetch(base+'/api/feature-pack/tasks',{method:'POST',headers:H,body:JSON.stringify({title:'Check queue'})}); assert.equal(c.status,201); const t=await c.json(); assert.equal(t.title,'Check queue');
  const u=await fetch(base+'/api/feature-pack/tasks/'+t.id,{method:'PUT',headers:H,body:JSON.stringify({status:'done'})}); assert.equal((await u.json()).status,'done');
  const l=await (await fetch(base+'/api/feature-pack/tasks',{headers:H})).json(); assert.equal(l.data.length,1);
});});
test('search/filter and CSV/JSON export preserve false/0', async ()=>{ await withServer(async(base)=>{
  const H={authorization:'Bearer x'};
  const s=await (await fetch(base+'/api/feature-pack/search?search=alpha',{headers:H})).json(); assert.equal(s.total,1); assert.equal(s.data[0].wait_time,0); assert.equal(s.data[0].flagged,false);
  const csv=await (await fetch(base+'/api/feature-pack/export?format=csv',{headers:H})).text(); assert.match(csv,/Alpha/); assert.match(csv,/false/);
  const js=await (await fetch(base+'/api/feature-pack/export?format=json',{headers:H})).json(); assert.equal(js.total,2);
  assert.deepEqual(filterRecords([{status:'open'}],{status:'closed'}),[]); assert.match(toCSV([{a:0,b:false,c:''}]),/0,false,/);
});});
test('domain AI fallback is labelled and preserves false/0/empty', async ()=>{
  for(const f of ['fraud-risk','reserve-estimate','settlement-recommendation']){ const r=await runAI(f,[{id:1,name:'Alpha',status:'closed',wait_time:0,estimated_amount:0,coverage_amount:0,premium:0,current_stock:0,drone_count:0,delta:0}],{}); assert.equal(r.aiGenerated,false,f); assert.equal(r.provider,null); assert.ok(r.sections && Object.keys(r.sections).length>0,f); }
});
