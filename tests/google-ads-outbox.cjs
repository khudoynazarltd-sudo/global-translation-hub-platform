const assert = require('node:assert/strict');
const fs = require('node:fs');
const {PGlite} = require('@electric-sql/pglite');
(async()=>{
 const db = new PGlite();
 await db.exec('create role anon; create role authenticated; create role service_role; create table public.enquiries(id uuid primary key); create table public.orders(id uuid primary key);');
 const sql=fs.readFileSync(require('node:path').join(__dirname,'../supabase/migrations/20260909_google_ads_conversions.sql'),'utf8');
 await db.exec(sql);
 await db.exec(sql); // repeatable migration
 await db.exec("insert into public.orders values ('00000000-0000-0000-0000-000000000001'); insert into public.google_ads_conversion_outbox(order_id,order_reference,stripe_session_id,stripe_event_id,event_payload) values ('00000000-0000-0000-0000-000000000001','GTH-local-only','cs_local_only','evt_local_only','{}');");
 const claim=()=>db.query("select * from public.claim_google_ads_conversion('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002',false,true)");
 const claims=await Promise.all([claim(),claim()]);
 assert.equal(claims.reduce((n,r)=>n+r.rows.length,0),1);
 assert.equal((await claim()).rows.length,0);
 await db.exec("update public.google_ads_conversion_outbox set status='submitted';");
 assert.equal((await db.query("select * from public.claim_google_ads_conversion('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002',true,true)")).rows.length,0);
 await db.exec("update public.google_ads_conversion_outbox set status='processing', updated_at=now()-interval '11 minutes';");
 assert.equal((await db.query("select * from public.claim_google_ads_conversion('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003',true,true)")).rows.length,1);
 const permission=await db.query("select has_table_privilege('anon','public.google_ads_conversion_outbox','select') as anon_read, has_table_privilege('authenticated','public.google_ads_conversion_outbox','select') as user_read, has_function_privilege('anon','public.claim_google_ads_conversion(uuid,uuid,boolean,boolean)','execute') as anon_claim");
 assert.deepEqual(permission.rows[0],{anon_read:false,user_read:false,anon_claim:false});
 await assert.rejects(db.exec("insert into public.google_ads_conversion_outbox select * from public.google_ads_conversion_outbox"));
 await db.close();
 console.log('PASS: migration repeatability, one claimant, duplicate rejection, submitted exclusion, stale recovery, private permissions. No production data used.');
})().catch(e=>{console.error(e);process.exitCode=1;});
