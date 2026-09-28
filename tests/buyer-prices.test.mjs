import test from 'node:test';
import assert from 'node:assert/strict';
import {formatPriceDisplay,getNumericPrice} from '../lib/price.js';
test('legacy space-separated prices display the full amount in both locales', () => {
  for (const [price, amount] of [
    ['9 800 000', 9800000],
    ['11 300 000', 11300000],
    ['9\u00a0800\u00a0000', 9800000],
    ['11\u202f300\u202f000', 11300000],
    ['AED 9 800 000', 9800000],
    ['۹ ۸۰۰ ۰۰۰ درهم', 9800000],
    ['٩ ٨٠٠ ٠٠٠', 9800000],
  ]) {
    assert.equal(getNumericPrice(price), amount);
    for (const locale of ['en', 'fa']) {
      assert.equal(formatPriceDisplay(price, { locale }), `AED ${amount.toLocaleString('en-US')}`);
    }
  }
});
test('ambiguous legacy prices never appear as AED 9',()=>{for(const price of ['9','AED 10',0,'',null]){assert.equal(getNumericPrice(price),0);assert.equal(formatPriceDisplay(price), 'Price on request');}});
test('explicit million amounts and Persian digits remain accurate',()=>{assert.equal(getNumericPrice('3.8M'),3800000);assert.equal(getNumericPrice('۳٬۸۰۰٬۰۰۰'),3800000);assert.equal(formatPriceDisplay('7,900,000'),'AED 7,900,000');});
