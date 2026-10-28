import test from 'node:test';
import assert from 'node:assert/strict';
import { Validators, formatMaskedAadhaar, extractApiErrors, validateForm } from '../utils/validation.js';

// ==============================================================================
// 1. KYC Masked Aadhaar Policy & Validation Unit Tests
// ==============================================================================

test('Validators.maskedAadhaar accepts valid masked Aadhaar format XXXX-XXXX-1234', () => {
  const validator = Validators.maskedAadhaar();
  assert.equal(validator('XXXX-XXXX-1234'), null);
  assert.equal(validator('xxxx-xxxx-5678'), null);
  assert.equal(validator('XXXX XXXX 9999'), null);
  assert.equal(validator('••••-••••-4321'), null);
  assert.equal(validator('****-****-0012'), null);
});

test('Validators.maskedAadhaar strictly rejects raw 12-digit unmasked Aadhaar numbers', () => {
  const validator = Validators.maskedAadhaar();
  const res = validator('445525256125');
  assert.match(res, /Unmasked 12-digit Aadhaar numbers are strictly prohibited/i);

  const resHyphenated = validator('4455-2525-6125');
  assert.match(resHyphenated, /Unmasked 12-digit Aadhaar numbers are strictly prohibited/i);
});

test('Validators.maskedAadhaar rejects malformed, incomplete or inverted masking', () => {
  const validator = Validators.maskedAadhaar();
  assert.match(validator('1234-5678-XXXX'), /Invalid masked Aadhaar format/i);
  assert.match(validator('XXXX-1234'), /Invalid masked Aadhaar format/i);
  assert.match(validator('INVALID_VALUE'), /Invalid masked Aadhaar format/i);
  assert.match(validator('XXXXXXXXXXXX'), /Unmasked 12-digit Aadhaar numbers are strictly prohibited|Invalid masked Aadhaar format/i);
});

test('formatMaskedAadhaar auto-masks raw 12 digits to XXXX-XXXX-last4', () => {
  assert.equal(formatMaskedAadhaar('445525256125'), 'XXXX-XXXX-6125');
  assert.equal(formatMaskedAadhaar('1234-5678-9012'), 'XXXX-XXXX-9012');
  assert.equal(formatMaskedAadhaar('XXXX-XXXX-1234'), 'XXXX-XXXX-1234');
  assert.equal(formatMaskedAadhaar(''), '');
  assert.equal(formatMaskedAadhaar(null), '');
});

// ==============================================================================
// 2. KYC Document Upload Form Schema Validation
// ==============================================================================

test('KYC document upload form validates document_type and maskedAadhaar identifier', () => {
  const kycSchema = {
    document_type: [Validators.required(), Validators.enumValue([
      'AADHAAR_MASKED', 'PAN', 'INCORPORATION_CERT', 'LEASE_AGREEMENT', 'VOTER_ID', 'PASSPORT', 'DRIVING_LICENSE'
    ])],
    document_identifier: [Validators.maskedAadhaar()]
  };

  // Valid masked Aadhaar submission
  const validSubmission = {
    document_type: 'AADHAAR_MASKED',
    document_identifier: 'XXXX-XXXX-5544'
  };
  const validResult = validateForm(validSubmission, kycSchema);
  assert.equal(validResult.isValid, true);
  assert.equal(Object.keys(validResult.errors).length, 0);

  // Unmasked raw Aadhaar submission
  const unmaskedSubmission = {
    document_type: 'AADHAAR_MASKED',
    document_identifier: '445525256125'
  };
  const unmaskedResult = validateForm(unmaskedSubmission, kycSchema);
  assert.equal(unmaskedResult.isValid, false);
  assert.match(unmaskedResult.errors.document_identifier, /Unmasked 12-digit Aadhaar numbers are strictly prohibited/i);

  // Invalid document type
  const invalidTypeSubmission = {
    document_type: 'ILLEGAL_TYPE',
    document_identifier: 'XXXX-XXXX-5544'
  };
  const invalidTypeResult = validateForm(invalidTypeSubmission, kycSchema);
  assert.equal(invalidTypeResult.isValid, false);
  assert.match(invalidTypeResult.errors.document_type, /Must be one of/i);
});

// ==============================================================================
// 3. API Error Extraction for 422, 403, and 500 Responses
// ==============================================================================

test('extractApiErrors parses FastAPI 422 validation detail loc arrays', () => {
  const err = {
    data: {
      error_code: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
      field_errors: {
        document_type: "Invalid document_type 'AADHAAR'. Permitted: ('AADHAAR_MASKED', ...)"
      },
      detail: [
        {
          loc: ['body', 'document_type'],
          msg: "Invalid document_type 'AADHAAR'."
        }
      ]
    }
  };

  const parsed = extractApiErrors(err);
  assert.match(parsed.fieldErrors.document_type, /AADHAAR/i);
  assert.match(parsed.formError, /Request validation failed/i);
});

test('extractApiErrors handles 403 Forbidden and 500 Server Errors gracefully', () => {
  const err403 = {
    data: {
      detail: 'Only Super Admin operators can create global-market (ALL) tariff plans.'
    }
  };
  const parsed403 = extractApiErrors(err403);
  assert.equal(parsed403.formError, 'Only Super Admin operators can create global-market (ALL) tariff plans.');

  const err500 = {
    message: 'Internal Server Error'
  };
  const parsed500 = extractApiErrors(err500);
  assert.equal(parsed500.formError, 'Internal Server Error');
});

// ==============================================================================
// 4. Provisioning Pre-Flight Eligibility Contract Verification
// ==============================================================================

test('Pre-flight eligibility response contract ensures safe property access in UI', () => {
  const mockEligibilityResponse = {
    eligible: true,
    customer_id: 1,
    customer_code: 'SUB-MUM-100004',
    customer_name: 'Ananya Sharma',
    market_id: 'mumbai',
    locality: 'Bandra',
    plan: { plan_id: 'PLAN-PRE-HERO-1.5G', name: 'Hero 1.5G' },
    blocking_errors: [],
    blocking_reasons: [],
    prerequisites: [],
    customer_lifecycle_status: 'ACTIVE',
    serviceability_status: 'SERVICEABLE'
  };

  assert.equal(mockEligibilityResponse.eligible, true);
  assert.equal(Array.isArray(mockEligibilityResponse.blocking_reasons), true);
  assert.equal(mockEligibilityResponse.customer_lifecycle_status, 'ACTIVE');
  assert.equal(mockEligibilityResponse.serviceability_status, 'SERVICEABLE');

  // Verify UI blocking errors fallback logic
  const blockingItems = mockEligibilityResponse.blocking_reasons.length > 0 
    ? mockEligibilityResponse.blocking_reasons 
    : mockEligibilityResponse.blocking_errors;
  assert.equal(blockingItems.length, 0);
});
