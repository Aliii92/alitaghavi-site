import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {getPropertyDeal,sortPropertiesByDeals} from '../lib/property-deals.js';
const now=Date.parse('2026-09-10T12:00:00+04:00');
const p={id:'offer',status:'Available',price:'3,800,000',deal:{type:'below-market',reference_price:'4,100,000',reference_url:'https://example.com/comparison',verified_at:'2026-09-09'}};
test('verified comparison and conservative percentage',()=>assert.equal(getPropertyDeal(p,now).discount,7.3));
test('missing, stale, future or unsafe comparison does not claim discount',()=>{
 for(const change of [{reference_url:''},{reference_url:'javascript:alert(1)'},{verified_at:'2026-07-01'},{verified_at:'2026-10-01'},{reference_price:'3000000'}]){
 const d=getPropertyDeal({...p,deal:{...p.deal,...change}},now);assert.equal(d.type,'special');assert.equal(d.discount,null);
 }
});
test('sold, hidden and expired offers are excluded',()=>{
 for(const status of ['sold','hidden','unavailable','withdrawn'])assert.equal(getPropertyDeal({...p,status},now),null);
 assert.equal(getPropertyDeal({...p,deal:{...p.deal,expires_at:'2026-09-09'}},now),null);
 assert.ok(getPropertyDeal({...p,deal:{...p.deal,expires_at:'2026-09-10'}},now));
});
test('special offers first with stable order and no mutation',()=>{
 const a=[{id:'a'},{id:'b',deal:{type:'urgent'}},{id:'c',deal:{type:'distress'}},{id:'d'}];
 assert.deepEqual(sortPropertiesByDeals(a).map(x=>x.id),['b','c','a','d']);assert.equal(a[0].id,'a');
});
test('sheet mapping allows only public fields and keeps status separate',()=>{
 const context={};vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../integrations/google-sheets/DubaiListing.gs',import.meta.url),'utf8'),context);
 const h=['Website ID','نمایش در سایت','AREA','BUILDING','STATUS','HANDOVER','نوع فرصت سایت','Owner Phone','notes'];
 const r=context.mapDubaiListingRow(['id',true,'Palm','Tower','Ready','sold','دیسترس','PRIVATE','PRIVATE'],h,'Dubai');
 assert.equal(r.status,'sold');assert.equal(r.deal.type,'distress');assert.ok(!JSON.stringify(r).includes('PRIVATE'));
});
