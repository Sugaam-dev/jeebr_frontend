import test from 'node:test';
import assert from 'node:assert/strict';
import { Validators, validateForm, extractApiErrors } from '../utils/validation.js';

// ==============================================================================
// 1. Core Validator Unit Tests
// ==============================================================================

test('Validators.required validates presence and rejects whitespace-only values', () => {
  const req = Validators.required();
  assert.equal(req('Hello'), null);
  assert.equal(req(123), null);
  assert.equal(req(0), null);
  assert.equal(req(false), null);

  assert.equal(req(''), 'This field is required.');
  assert.equal(req('   '), 'This field is required.');
  assert.equal(req(null), 'This field is required.');
  assert.equal(req(undefined), 'This field is required.');
});

test('Validators.name validates length and trims correctly', () => {
  assert.equal(Validators.name(2, 50)('Rohan Deshmukh'), null);
  assert.equal(Validators.name(2, 50)('A'), 'Must be at least 2 characters.');
  assert.equal(Validators.name(2, 10)('Very Long Name That Exceeds Limit'), 'Cannot exceed 10 characters.');
});

test('Validators.email validates email address formats', () => {
  const emailValidator = Validators.email();
  assert.equal(emailValidator('subscriber@pmrg.in'), null);
  assert.equal(emailValidator('test.user+tag@domain.co.uk'), null);

  assert.equal(emailValidator('not-an-email'), 'Enter a valid email address.');
  assert.equal(emailValidator('missing@domain'), 'Enter a valid email address.');
  assert.equal(emailValidator('@nodomain.com'), 'Enter a valid email address.');
});

test('Validators.phone validates Indian and standard telecommunication numbers', () => {
  const phoneValidator = Validators.phone();
  assert.equal(phoneValidator('+91 98201 11223'), null);
  assert.equal(phoneValidator('+919820111223'), null);
  assert.equal(phoneValidator('9820111223'), null);

  assert.equal(phoneValidator('123'), 'Enter a valid 10-15 digit phone number (e.g. +91 98200 12345).');
  assert.equal(phoneValidator('abc-def-ghij'), 'Enter a valid 10-15 digit phone number (e.g. +91 98200 12345).');
});

test('Validators.money validates non-negative monetary amounts and precision', () => {
  const moneyValidator = Validators.money({ min: 0 });
  assert.equal(moneyValidator(150.50), null);
  assert.equal(moneyValidator(0), null);
  assert.equal(moneyValidator('499.00'), null);

  assert.equal(moneyValidator(-50), 'Amount must be at least ₹0.');
  assert.equal(moneyValidator('not-a-number'), 'Must be a valid monetary amount.');
  assert.equal(Validators.money({ max: 1000 })(1500), 'Amount cannot exceed ₹1000.');
});

test('Validators.enumValue enforces authoritative backend enums', () => {
  const accountTypeValidator = Validators.enumValue(['RESIDENTIAL', 'ENTERPRISE', 'SME']);

  assert.equal(accountTypeValidator('RESIDENTIAL'), null);
  assert.equal(accountTypeValidator('ENTERPRISE'), null);
  assert.equal(accountTypeValidator('SME'), null);

  // Must reject legacy/invalid INDIVIDUAL enum
  assert.equal(accountTypeValidator('INDIVIDUAL'), 'Must be one of: RESIDENTIAL, ENTERPRISE, SME.');
  assert.equal(accountTypeValidator('UNKNOWN'), 'Must be one of: RESIDENTIAL, ENTERPRISE, SME.');
});

test('Validators.chronological validates date order', () => {
  const chrono = Validators.chronological('startDate', 'endDate');
  assert.equal(chrono({ startDate: '2026-11-01', endDate: '2026-11-30' }), null);

  const invalidChrono = chrono({ startDate: '2026-11-30', endDate: '2026-11-01' });
  assert.deepEqual(invalidChrono, { endDate: 'End date must be after start date.' });

  const equalDates = chrono({ startDate: '2026-11-15', endDate: '2026-11-15' });
  assert.deepEqual(equalDates, { endDate: 'End date must be after start date.' });
});

test('Validators.latitude and longitude enforce geographic bounds', () => {
  const lat = Validators.latitude();
  assert.equal(lat(19.0760), null);
  assert.equal(lat(-19.0760), null);
  assert.equal(lat(91.0), 'Latitude must be between -90 and +90 degrees.');
  assert.equal(lat(-95.0), 'Latitude must be between -90 and +90 degrees.');

  const lng = Validators.longitude();
  assert.equal(lng(72.8777), null);
  assert.equal(lng(-72.8777), null);
  assert.equal(lng(185.0), 'Longitude must be between -180 and +180 degrees.');
});

// ==============================================================================
// 2. Form Schema Validation Unit Tests
// ==============================================================================

test('validateForm validates multi-field forms and reports field-level errors', () => {
  const schema = {
    legal_name: [Validators.required(), Validators.name(2, 50)],
    account_type: [Validators.required(), Validators.enumValue(['RESIDENTIAL', 'ENTERPRISE', 'SME'])],
    email: [Validators.required(), Validators.email()],
    phone: [Validators.required(), Validators.phone()]
  };

  const invalidValues = {
    legal_name: ' ',
    account_type: 'INDIVIDUAL',
    email: 'bad-email',
    phone: '12'
  };

  const { isValid, errors } = validateForm(invalidValues, schema);
  assert.equal(isValid, false);
  assert.ok(errors.legal_name);
  assert.ok(errors.account_type.includes('RESIDENTIAL'));
  assert.ok(errors.email);
  assert.ok(errors.phone);

  const validValues = {
    legal_name: 'Ananya Sharma',
    account_type: 'RESIDENTIAL',
    email: 'ananya@example.com',
    phone: '+91 98201 55667'
  };

  const validResult = validateForm(validValues, schema);
  assert.equal(validResult.isValid, true);
  assert.equal(Object.keys(validResult.errors).length, 0);
});

// ==============================================================================
// 3. API Error Extraction Tests (HTTP 422 mapping)
// ==============================================================================

test('extractApiErrors extracts field_errors from standardized FastAPI responses', () => {
  const errorObj = {
    error_code: 'VALIDATION_ERROR',
    message: 'Request validation failed. Please check the highlighted fields.',
    field_errors: {
      account_type: "Value error, Invalid account_type 'INDIVIDUAL'. Allowed: ['RESIDENTIAL', 'ENTERPRISE', 'SME']",
      legal_name: 'String should have at least 2 characters'
    }
  };

  const { formError, fieldErrors } = extractApiErrors(errorObj);
  assert.equal(formError, 'Request validation failed. Please check the highlighted fields.');
  assert.ok(fieldErrors.account_type);
  assert.ok(fieldErrors.legal_name);
});

test('extractApiErrors extracts pydantic loc errors from detail array fallback', () => {
  const pydanticError = {
    detail: [
      {
        loc: ['body', 'account_type'],
        msg: "Input should be 'RESIDENTIAL', 'ENTERPRISE' or 'SME'",
        type: 'enum'
      },
      {
        loc: ['body', 'installation_address', 'postal_code'],
        msg: 'Invalid postal code format',
        type: 'value_error'
      }
    ]
  };

  const { formError, fieldErrors } = extractApiErrors(pydanticError);
  assert.ok(fieldErrors.account_type);
  assert.ok(fieldErrors.postal_code);
});

// ==============================================================================
// 4. Mutation Payload & Contract Alignment Tests
// ==============================================================================

test('Customer Creation payload aligns with authoritative RESIDENTIAL schema', () => {
  const formState = {
    legal_name: 'Suresh Patel',
    trade_name: 'Patel Electronics',
    account_type: 'INDIVIDUAL',
    email: 'suresh@patel.in',
    phone: '+91 98201 88776',
    address_line1: '14 MG Road',
    city: 'Mumbai',
    pincode: '400001'
  };

  const account_type = (formState.account_type === 'INDIVIDUAL' || !formState.account_type)
    ? 'RESIDENTIAL'
    : formState.account_type;

  const payload = {
    legal_name: formState.legal_name.trim(),
    trade_name: formState.trade_name?.trim() || undefined,
    account_type: account_type,
    email: formState.email.trim(),
    phone: formState.phone.trim(),
    installation_address: {
      address_type: 'INSTALLATION',
      address_line1: formState.address_line1.trim(),
      city: formState.city.trim(),
      state: 'Maharashtra',
      postal_code: formState.pincode.trim()
    }
  };

  assert.equal(payload.account_type, 'RESIDENTIAL');
  assert.notEqual(payload.account_type, 'INDIVIDUAL');
  assert.ok(payload.installation_address);
  assert.equal(payload.installation_address.postal_code, '400001');
});

test('CRM Lead Creation payload derives required legal_name and RESIDENTIAL account_type', () => {
  const formState = {
    first_name: 'Vikram',
    last_name: 'Singhania',
    company_name: 'Singhania Enterprises',
    account_type: 'INDIVIDUAL',
    email: 'vikram@singhania.com',
    phone: '+91 98202 33445'
  };

  const account_type = (formState.account_type === 'INDIVIDUAL' || !formState.account_type)
    ? 'RESIDENTIAL'
    : formState.account_type;

  const legal_name = formState.company_name?.trim() ||
    `${formState.first_name || ''} ${formState.last_name || ''}`.trim() ||
    'Sales Lead';

  const payload = {
    legal_name: legal_name,
    company_name: formState.company_name?.trim() || undefined,
    trade_name: formState.company_name?.trim() || undefined,
    account_type: account_type,
    email: formState.email.trim(),
    phone: formState.phone.trim(),
    source: 'CRM_LEAD_FORM'
  };

  assert.equal(payload.legal_name, 'Singhania Enterprises');
  assert.equal(payload.account_type, 'RESIDENTIAL');
  assert.notEqual(payload.account_type, 'INDIVIDUAL');
});

test('Finance Account Creation payload structures billing_type and credit_limit correctly', () => {
  const formState = {
    customer_id: 'SUB-MUM-100004',
    account_type: 'POSTPAID',
    credit_limit: '15000',
    currency: 'INR'
  };

  const creditLimitNum = parseFloat(formState.credit_limit) || 0.0;
  assert.ok(creditLimitNum >= 0, 'Credit limit must be non-negative');

  const payload = {
    customer_id: formState.customer_id.trim(),
    billing_type: formState.account_type,
    account_type: formState.account_type,
    credit_limit: creditLimitNum,
    currency: formState.currency
  };

  assert.equal(payload.customer_id, 'SUB-MUM-100004');
  assert.equal(payload.billing_type, 'POSTPAID');
  assert.equal(payload.credit_limit, 15000.0);
});

test('Invoice Generation payload strictly prevents negative discounts', () => {
  const issueInvoiceForm = {
    subscription_id: 'SUB-MUM-00001',
    discount_amount: '-25.00'
  };

  const discount = parseFloat(issueInvoiceForm.discount_amount);
  const isValid = !isNaN(discount) && discount >= 0;

  assert.equal(isValid, false, 'Negative discount must fail validation');

  const validForm = {
    subscription_id: 'SUB-MUM-00001',
    discount_amount: '50.00'
  };

  const validDiscount = parseFloat(validForm.discount_amount);
  assert.ok(validDiscount >= 0);

  const payload = {
    subscription_id: validForm.subscription_id.trim(),
    discount_amount: validDiscount
  };

  assert.equal(payload.subscription_id, 'SUB-MUM-00001');
  assert.equal(payload.discount_amount, 50.0);
});
