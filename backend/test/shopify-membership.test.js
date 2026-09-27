import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addMonthsIso,
  customerDataFromOrder,
  isOrderPaid,
  isPaidOrderTopic,
  membershipItemsFromOrder,
  receiptNumber
} from '../shopify-membership.js';

test('maps every configured Shopify membership SKU', () => {
  const items = membershipItemsFromOrder({
    line_items: [
      { id: 1, sku: 'CAE-MEMBERSHIP-SMART' },
      { id: 2, sku: 'cae-membership-mamma' },
      { id: 3, sku: 'CAE-MEMBERSHIP-GOLD' },
      { id: 4, sku: 'CAE-MEMBERSHIP-PLATINUM' },
      { id: 5, sku: 'UNRELATED-PRODUCT' }
    ]
  });
  assert.deepEqual(items.map(value => value.plan.code), ['SMART', 'MAMMA', 'GOLD', 'PLATINUM']);
});

test('extracts a Shopify customer and billing address', () => {
  const data = customerDataFromOrder({
    email: 'client@example.com',
    customer: { id: 123, first_name: 'Mario', last_name: 'Rossi' },
    billing_address: { address1: 'Via Roma 1', city: 'Firenze', zip: '50100', country: 'Italia' }
  });
  assert.equal(data.shopify_customer_id, '123');
  assert.equal(data.customer_first_name, 'Mario');
  assert.equal(data.email, 'client@example.com');
  assert.equal(data.city, 'Firenze');
});

test('adds twelve calendar months safely', () => {
  assert.equal(addMonthsIso('2026-01-31T10:00:00.000Z', 12), '2027-01-31T10:00:00.000Z');
});

test('recognizes paid topics and financial status', () => {
  assert.equal(isPaidOrderTopic('orders/paid'), true);
  assert.equal(isPaidOrderTopic('orders-paid'), true);
  assert.equal(isPaidOrderTopic('products/update'), false);
  assert.equal(isOrderPaid({ financial_status: 'paid' }), true);
  assert.equal(isOrderPaid({ financial_status: 'pending' }), false);
});

test('creates stable receipt numbers', () => {
  assert.equal(receiptNumber({ order_number: 1205 }, 2), 'CAE-MEM-1205-02');
});
