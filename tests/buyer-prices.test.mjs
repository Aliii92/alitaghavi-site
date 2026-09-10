import test from 'node:test';
import assert from 'node:assert/strict';
import {formatPriceDisplay,getNumericPrice} from '../lib/price.js';
test('ambiguous legacy prices never appear as AED 9',()=>{for(const price of ['9','AED 10',0,'',null]){assert.equal(getNumericPrice(price),0);assert.equal(formatPriceDisplay(price), 'Price on request');}});
test('explicit million amounts and Persian digits remain accurate',()=>{assert.equal(getNumericPrice('3.8M'),3800000);assert.equal(getNumericPrice('۳٬۸۰۰٬۰۰۰'),3800000);assert.equal(formatPriceDisplay('7,900,000'),'AED 7,900,000');});
