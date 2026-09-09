import test from 'node:test';
import assert from 'node:assert/strict';
import { preparePaidConversion } from '../src/lib/google-ads/event.ts';
// Local fixtures only. No network calls or production purchases.
const base = {live:true, amountMinor:12345, currency:'gbp', timestampSeconds:1788930000,
  orderReference:'GTH-2026-09-000001', gclid:'LOCAL_ONLY_FIXTURE_1234567890', consent:'accepted'};
test('preserves exact Stripe revenue, timestamp, order ID and minimal fields', () => {
  const {event}=preparePaidConversion(base);
  assert.equal(event.conversionValue,123.45);
  assert.equal(event.currency,'GBP');
  assert.equal(event.transactionId,base.orderReference);
  assert.equal(event.eventTimestamp,new Date(base.timestampSeconds*1000).toISOString());
  assert.equal(event.userData,undefined);
  assert.deepEqual(preparePaidConversion(base),preparePaidConversion(base));
});
for(const [name,patch,reason] of [
 ['direct customer',{gclid:null},'no_gclid'],
 ['known fake click',{gclid:'TEST-GCLID-123'},'invalid_or_test_gclid'],
 ['test payment',{live:false},'test_payment'],
 ['rejected consent',{consent:'rejected'},'no_ads_consent'],
 ['missing historical consent',{consent:null},'no_ads_consent'],
 ['wrong currency',{currency:'usd'},'invalid_paid_amount_or_currency'],
 ['missing Stripe amount',{amountMinor:null},'invalid_paid_amount_or_currency'],
 ['zero amount',{amountMinor:0},'invalid_paid_amount_or_currency'],
 ['fractional minor units',{amountMinor:15.5},'invalid_paid_amount_or_currency']
]) test(name,()=>assert.equal(preparePaidConversion({...base,...patch}).reason,reason));
