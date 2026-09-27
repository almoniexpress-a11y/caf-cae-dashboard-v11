export const MEMBERSHIP_PLANS_BY_SKU = Object.freeze({
  'CAE-MEMBERSHIP-SMART': {
    code: 'SMART',
    name: 'CAF CAE Membership Smart',
    durationMonths: 12,
    practiceCredits: 1,
    discountPercent: 10,
    maxFamilyMembers: 1
  },
  'CAE-MEMBERSHIP-MAMMA': {
    code: 'MAMMA',
    name: 'CAF CAE Membership Mamma & Bebè',
    durationMonths: 12,
    practiceCredits: 5,
    discountPercent: 10,
    maxFamilyMembers: 5
  },
  'CAE-MEMBERSHIP-GOLD': {
    code: 'GOLD',
    name: 'CAF CAE Membership Gold',
    durationMonths: 12,
    practiceCredits: 3,
    discountPercent: 15,
    maxFamilyMembers: 1
  },
  'CAE-MEMBERSHIP-PLATINUM': {
    code: 'PLATINUM',
    name: 'CAF CAE Membership Platinum',
    durationMonths: 12,
    practiceCredits: 5,
    discountPercent: 20,
    maxFamilyMembers: 5
  }
});

export function normalizeSku(value) {
  return String(value || '').trim().toUpperCase();
}

export function membershipItemsFromOrder(order = {}) {
  return (Array.isArray(order.line_items) ? order.line_items : [])
    .map(item => {
      const sku = normalizeSku(item?.sku);
      const plan = MEMBERSHIP_PLANS_BY_SKU[sku];
      return plan ? { item, sku, plan, quantity: Math.max(1, Number(item?.quantity || 1)) } : null;
    })
    .filter(Boolean);
}

export function shopifyOrderReference(order = {}) {
  return String(order.id || order.admin_graphql_api_id || order.order_number || order.name || '').trim();
}

export function shopifyCustomerReference(order = {}) {
  return String(order.customer?.id || order.customer?.admin_graphql_api_id || '').trim();
}

export function customerDataFromOrder(order = {}) {
  const source = order.billing_address || order.shipping_address || order.customer?.default_address || {};
  const customer = order.customer || {};
  return {
    shopify_customer_id: shopifyCustomerReference(order) || null,
    customer_first_name: customer.first_name || source.first_name || null,
    customer_last_name: customer.last_name || source.last_name || null,
    email: order.email || customer.email || null,
    phone: order.phone || customer.phone || source.phone || null,
    address: [source.address1, source.address2].filter(Boolean).join(', ') || null,
    city: source.city || null,
    province: source.province || source.province_code || null,
    cap: source.zip || null,
    country: source.country || source.country_code || 'Italia',
    status: 'Active',
    updated_by: 'shopify-webhook'
  };
}

export function addMonthsIso(dateValue, months) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid membership start date');
  const originalDay = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + Number(months || 0));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(originalDay, lastDay));
  return date.toISOString();
}

export function receiptNumber(order = {}, sequence = 1) {
  const orderPart = String(order.order_number || order.name || order.id || 'ORDER').replace(/[^A-Za-z0-9]/g, '');
  return `CAE-MEM-${orderPart}-${String(sequence).padStart(2, '0')}`;
}

export function isPaidOrderTopic(topic = '') {
  const normalized = String(topic).trim().toLowerCase().replace(/_/g, '/').replace(/-/g, '/');
  return normalized === 'orders/paid' || normalized === 'orders/create';
}

export function isOrderPaid(order = {}) {
  return ['paid', 'partially_paid'].includes(String(order.financial_status || '').toLowerCase());
}
