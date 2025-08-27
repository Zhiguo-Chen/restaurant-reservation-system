import { ValidationResult, ValidationError } from "../types";

/**
 * Email validation utility
 */
export const validateEmail = (email: string): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!email || email.trim().length === 0) {
    errors.push({
      field: "email",
      message: "Email is required",
      code: "REQUIRED",
    });
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push({
        field: "email",
        message: "Invalid email format",
        code: "INVALID_FORMAT",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Phone number validation utility
 */
export const validatePhoneNumber = (phone: string): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!phone || phone.trim().length === 0) {
    errors.push({
      field: "phone",
      message: "Phone number is required",
      code: "REQUIRED",
    });
  } else {
    // Remove all non-digit characters except + at the beginning
    const cleanPhone = phone.replace(/[^\d+]/g, "");

    // Check for valid phone number patterns
    const phoneRegex = /^(\+\d{1,3})?[\d\s\-\(\)]{7,15}$/;
    if (
      !phoneRegex.test(phone.trim()) ||
      cleanPhone.length < 7 ||
      cleanPhone.length > 18
    ) {
      errors.push({
        field: "phone",
        message: "Invalid phone number format",
        code: "INVALID_FORMAT",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Date validation utility
 */
export const validateFutureDate = (
  date: Date,
  fieldName: string = "date"
): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!date) {
    errors.push({
      field: fieldName,
      message: `${fieldName} is required`,
      code: "REQUIRED",
    });
  } else if (!(date instanceof Date) || isNaN(date.getTime())) {
    errors.push({
      field: fieldName,
      message: `Invalid ${fieldName} format`,
      code: "INVALID_FORMAT",
    });
  } else if (date <= new Date()) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be in the future`,
      code: "INVALID_DATE",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * String length validation utility
 */
export const validateStringLength = (
  value: string,
  fieldName: string,
  minLength: number = 0,
  maxLength: number = Infinity,
  required: boolean = true
): ValidationResult => {
  const errors: ValidationError[] = [];

  if (!value || value.trim().length === 0) {
    if (required) {
      errors.push({
        field: fieldName,
        message: `${fieldName} is required`,
        code: "REQUIRED",
      });
    }
  } else {
    const trimmedValue = value.trim();

    if (trimmedValue.length < minLength) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at least ${minLength} characters long`,
        code: "MIN_LENGTH",
      });
    }

    if (trimmedValue.length > maxLength) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must not exceed ${maxLength} characters`,
        code: "MAX_LENGTH",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Number range validation utility
 */
export const validateNumberRange = (
  value: number,
  fieldName: string,
  min: number = 0,
  max: number = Infinity
): ValidationResult => {
  const errors: ValidationError[] = [];

  if (value === null || value === undefined) {
    errors.push({
      field: fieldName,
      message: `${fieldName} is required`,
      code: "REQUIRED",
    });
  } else if (typeof value !== "number" || isNaN(value)) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be a valid number`,
      code: "INVALID_FORMAT",
    });
  } else {
    if (value < min) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at least ${min}`,
        code: "MIN_VALUE",
      });
    }

    if (value > max) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must not exceed ${max}`,
        code: "MAX_VALUE",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Combines multiple validation results
 */
export const combineValidationResults = (
  ...results: ValidationResult[]
): ValidationResult => {
  const allErrors = results.flatMap((result) => result.errors);

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
};
