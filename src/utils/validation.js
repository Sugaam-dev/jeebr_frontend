/**
 * SentinelOS / Jeebr Global Input Validation & Schema Engine
 *
 * Provides reusable validation rules, schema validation, API error mapping,
 * and a form hook satisfying all 14 Phase 3 frontend validation requirements.
 */

// ─── Primitive Validation Rules ──────────────────────────────────────────────

export const Validators = {
  required: (msg = 'This field is required.') => (val) => {
    if (val === undefined || val === null) return msg;
    if (typeof val === 'string' && !val.trim()) return msg;
    if (Array.isArray(val) && val.length === 0) return msg;
    return null;
  },

  name: (min = 2, max = 255, msg = null) => (val) => {
    if (!val) return null;
    const trimmed = typeof val === 'string' ? val.trim() : '';
    if (trimmed.length < min) return msg || `Must be at least ${min} characters.`;
    if (trimmed.length > max) return msg || `Cannot exceed ${max} characters.`;
    return null;
  },

  email: (msg = 'Enter a valid email address.') => (val) => {
    if (!val) return null;
    const trimmed = typeof val === 'string' ? val.trim() : '';
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
    if (!emailRegex.test(trimmed)) return msg;
    return null;
  },

  phone: (msg = 'Enter a valid 10-15 digit phone number (e.g. +91 98200 12345).') => (val) => {
    if (!val) return null;
    const trimmed = typeof val === 'string' ? val.trim() : '';
    const phoneRegex = /^[+]?[0-9\s-]{10,18}$/;
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (!phoneRegex.test(trimmed) || digitsOnly.length < 10 || digitsOnly.length > 15) {
      return msg;
    }
    return null;
  },

  number: ({ min, max, integer = false, msg = null }) => (val) => {
    if (val === '' || val === null || val === undefined) return null;
    const num = Number(val);
    if (isNaN(num)) return msg || 'Must be a valid number.';
    if (integer && !Number.isInteger(num)) return msg || 'Must be an integer.';
    if (min !== undefined && num < min) return msg || `Must be at least ${min}.`;
    if (max !== undefined && num > max) return msg || `Must not exceed ${max}.`;
    return null;
  },

  money: ({ min = 0, max, msg = null }) => (val) => {
    if (val === '' || val === null || val === undefined) return null;
    const num = Number(val);
    if (isNaN(num)) return msg || 'Must be a valid monetary amount.';
    if (min !== undefined && num < min) return msg || `Amount must be at least ₹${min}.`;
    if (max !== undefined && num > max) return msg || `Amount cannot exceed ₹${max}.`;
    // Validate max 2 decimal places
    const str = String(val);
    if (str.includes('.') && str.split('.')[1].length > 2) {
      return msg || 'Monetary amounts cannot have more than 2 decimal places.';
    }
    return null;
  },

  date: ({ minDate, maxDate, msg = null }) => (val) => {
    if (!val) return null;
    const d = new Date(val);
    if (isNaN(d.getTime())) return msg || 'Must be a valid date.';
    if (minDate && d < new Date(minDate)) return msg || `Date must be after ${minDate}.`;
    if (maxDate && d > new Date(maxDate)) return msg || `Date must be before ${maxDate}.`;
    return null;
  },

  chronological: (earlierDateField, laterDateField, msg = 'End date must be after start date.') => (values) => {
    const start = values[earlierDateField];
    const end = values[laterDateField];
    if (start && end) {
      const dStart = new Date(start);
      const dEnd = new Date(end);
      if (!isNaN(dStart.getTime()) && !isNaN(dEnd.getTime()) && dStart >= dEnd) {
        return { [laterDateField]: msg };
      }
    }
    return null;
  },

  identifier: (maxLen = 32, msg = 'Only letters, numbers, hyphens, and underscores are allowed.') => (val) => {
    if (!val) return null;
    const trimmed = typeof val === 'string' ? val.trim() : '';
    if (trimmed.length > maxLen) return `Identifier must not exceed ${maxLen} characters.`;
    if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) return msg;
    return null;
  },

  enumValue: (allowed = [], msg = null) => (val) => {
    if (!val) return null;
    if (!allowed.includes(val)) {
      return msg || `Must be one of: ${allowed.join(', ')}.`;
    }
    return null;
  },

  latitude: (msg = 'Latitude must be between -90 and +90 degrees.') => (val) => {
    if (val === '' || val === null || val === undefined) return null;
    const num = Number(val);
    if (isNaN(num) || num < -90 || num > 90) return msg;
    return null;
  },

  longitude: (msg = 'Longitude must be between -180 and +180 degrees.') => (val) => {
    if (val === '' || val === null || val === undefined) return null;
    const num = Number(val);
    if (isNaN(num) || num < -180 || num > 180) return msg;
    return null;
  },

  password: (min = 6, msg = null) => (val) => {
    if (!val) return msg || 'Password is required.';
    if (val.length < min) return msg || `Password must be at least ${min} characters.`;
    return null;
  },

  maskedAadhaar: (msg = 'Invalid masked Aadhaar format. Must match XXXX-XXXX-1234 with the first 8 digits masked.') => (val) => {
    if (!val) return null;
    const str = String(val).trim();
    const cleanDigits = str.replace(/[\s-]/g, '');
    // Strictly prohibit unmasked 12 digits
    if (/^\d{12}$/.test(cleanDigits)) {
      return 'Unmasked 12-digit Aadhaar numbers are strictly prohibited. Provide an authorized masked Aadhaar identifier (e.g. XXXX-XXXX-1234).';
    }
    // Must match masked format: first 8 masked with X, *, or bullet, last 4 are digits
    const maskedRegex = /^[X*•x]{4}[-\s]?[X*•x]{4}[-\s]?\d{4}$/i;
    if (!maskedRegex.test(str)) {
      return msg;
    }
    return null;
  }
};

/**
 * Normalizes and formats an Aadhaar input, auto-masking first 8 digits
 */
export function formatMaskedAadhaar(val) {
  if (!val) return '';
  const str = String(val).trim();
  const digitsOnly = str.replace(/\D/g, '');
  if (digitsOnly.length === 12 && !/[X*•x]/i.test(str)) {
    return `XXXX-XXXX-${digitsOnly.slice(8)}`;
  }
  return str;
}

// ─── Schema Validator ────────────────────────────────────────────────────────

/**
 * Validates form values against a schema definition.
 * Schema maps field names to arrays of validator functions.
 * Also supports schema._crossField array of cross-field validator functions.
 */
export function validateForm(values, schema = {}) {
  const errors = {};

  for (const [field, rules] of Object.entries(schema)) {
    if (field.startsWith('_')) continue; // Skip cross-field rules
    const ruleList = Array.isArray(rules) ? rules : [rules];
    for (const rule of ruleList) {
      if (typeof rule === 'function') {
        const error = rule(values[field], values);
        if (error) {
          errors[field] = error;
          break; // Stop at first error for this field
        }
      }
    }
  }

  // Cross-field validators
  if (Array.isArray(schema._crossField)) {
    for (const crossRule of schema._crossField) {
      if (typeof crossRule === 'function') {
        const crossErrs = crossRule(values);
        if (crossErrs) {
          Object.assign(errors, crossErrs);
        }
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// ─── API Error Mapping ───────────────────────────────────────────────────────

/**
 * Standardizes extraction of field errors and form-level error messages
 * from Axios/Fetch errors (including FastAPI 422 loc arrays).
 */
export function extractApiErrors(err) {
  const result = {
    fieldErrors: {},
    formError: ''
  };

  if (!err) return result;

  const data = err.data || err;

  // 1. Direct field_errors map from SentinelOS standardized API handler
  if (data?.field_errors && typeof data.field_errors === 'object') {
    result.fieldErrors = { ...data.field_errors };
  } else if (err.fieldErrors && typeof err.fieldErrors === 'object') {
    result.fieldErrors = { ...err.fieldErrors };
  }

  // 2. FastAPI default detail array of loc errors
  if (Array.isArray(data?.detail)) {
    for (const item of data.detail) {
      const loc = item.loc || [];
      const field = loc.length > 0 ? String(loc[loc.length - 1]) : 'general';
      const msg = item.msg || 'Invalid field';
      if (!result.fieldErrors[field]) {
        result.fieldErrors[field] = msg;
      }
    }
  }

  // 3. String detail (400, 401, 403, 404, 409, 500)
  if (typeof data?.detail === 'string') {
    result.formError = data.detail;
  } else if (data?.message && typeof data.message === 'string') {
    result.formError = data.message;
  } else if (err.message) {
    result.formError = err.message;
  } else {
    result.formError = 'A server error occurred. Please check input and try again.';
  }

  // If there are field errors but no distinct formError, synthesize a clear form alert
  if (Object.keys(result.fieldErrors).length > 0 && !result.formError) {
    const fields = Object.keys(result.fieldErrors).join(', ');
    result.formError = `Validation failed for: ${fields}. Please correct the highlighted fields.`;
  }

  return result;
}

// ─── React useForm Hook ──────────────────────────────────────────────────────

import { useState, useCallback } from 'react';

export function useFormValidation({
  initialValues = {},
  schema = {},
  onSubmit = null
}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateField = useCallback((name, value, allValues) => {
    const rules = schema[name];
    if (!rules) return null;
    const ruleList = Array.isArray(rules) ? rules : [rules];
    for (const rule of ruleList) {
      if (typeof rule === 'function') {
        const err = rule(value, allValues || values);
        if (err) return err;
      }
    }
    return null;
  }, [schema, values]);

  const handleChange = useCallback((name, value) => {
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      // Real-time validation if touched
      if (touched[name]) {
        const err = validateField(name, value, next);
        setErrors((prevErr) => ({ ...prevErr, [name]: err || undefined }));
      }
      return next;
    });
    setFormError('');
  }, [touched, validateField]);

  const handleBlur = useCallback((name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, values[name], values);
    setErrors((prev) => ({ ...prev, [name]: err || undefined }));
  }, [validateField, values]);

  const handleSubmit = useCallback(async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitting) return; // Prevent double submission

    setIsSubmitted(true);
    setFormError('');

    // Mark all fields touched
    const allTouched = {};
    Object.keys(schema).forEach((k) => { allTouched[k] = true; });
    setTouched(allTouched);

    const { isValid, errors: validationErrors } = validateForm(values, schema);
    setErrors(validationErrors);

    if (!isValid) {
      setFormError('Please resolve all validation errors before proceeding.');
      return;
    }

    if (!onSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      const { fieldErrors, formError: serverError } = extractApiErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }
      setFormError(serverError || err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, onSubmit, schema, values]);

  const resetForm = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setFormError('');
    setIsSubmitted(false);
    setIsSubmitting(false);
  }, [initialValues]);

  const getFieldProps = useCallback((name, options = {}) => {
    const isRequired = Array.isArray(schema[name])
      ? schema[name].some((fn) => fn.isRequired)
      : false;
    const hasError = Boolean(errors[name]);

    return {
      name,
      value: values[name] ?? '',
      onChange: (e) => {
        const val = e && e.target !== undefined ? e.target.value : e;
        handleChange(name, val);
      },
      onBlur: () => handleBlur(name),
      'aria-invalid': hasError ? 'true' : 'false',
      'aria-describedby': hasError ? `${name}-error` : undefined,
      'aria-required': isRequired ? 'true' : undefined,
      ...options
    };
  }, [errors, handleBlur, handleChange, schema, values]);

  return {
    values,
    setValues,
    errors,
    setErrors,
    touched,
    isSubmitting,
    formError,
    setFormError,
    isSubmitted,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    getFieldProps,
    setFieldError: (field, msg) => setErrors((prev) => ({ ...prev, [field]: msg })),
    setFieldErrors: (errObj) => setErrors((prev) => ({ ...prev, ...errObj }))
  };
}
