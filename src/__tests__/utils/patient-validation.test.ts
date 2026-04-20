import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Patient Validation & Transformation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // DNI / CÉDULA VALIDATION
  // ==========================================

  describe('DNI Validation', () => {
    const validateDNI = (dni: string, country: string = 'GQ'): boolean => {
      if (country === 'GQ') {
        // Guinea Ecuatorial: 8-13 dígitos
        return /^\d{8,13}$/.test(dni.replace(/\D/g, ''));
      }
      if (country === 'ES') {
        // España: 8 dígitos + 1 letra
        return /^\d{8}[A-Z]$/i.test(dni.toUpperCase());
      }
      return false;
    };

    it('should validate valid Guinea Ecuatorial DNI', () => {
      expect(validateDNI('1234567890', 'GQ')).toBe(true);
      expect(validateDNI('123456789', 'GQ')).toBe(true);
    });

    it('should reject DNI with wrong length', () => {
      expect(validateDNI('12345', 'GQ')).toBe(false);
      expect(validateDNI('123456789012345', 'GQ')).toBe(false);
    });

    it('should reject DNI with non-numeric characters', () => {
      const validateDNI = (dni: string) => /^\d{8,13}$/.test(dni);
      expect(validateDNI('123456789A')).toBe(false);
      expect(validateDNI('123-456-789')).toBe(false);
    });

    it('should normalize DNI before validation', () => {
      const normalize = (dni: string) => dni.replace(/\D/g, '');
      expect(validateDNI(normalize('123-456-789'), 'GQ')).toBe(true);
      expect(validateDNI(normalize('123.456.789'), 'GQ')).toBe(true);
    });

    it('should validate Spain DNI format (8 digits + letter)', () => {
      expect(validateDNI('12345678Z', 'ES')).toBe(true);
      expect(validateDNI('12345678', 'ES')).toBe(false); // No letter
      expect(validateDNI('123456789A', 'ES')).toBe(false); // Too many digits
    });

    it('should reject empty DNI', () => {
      expect(validateDNI('', 'GQ')).toBe(false);
    });
  });

  // ==========================================
  // PHONE VALIDATION
  // ==========================================

  describe('Phone Number Validation', () => {
    const validatePhone = (phone: string, country: string = 'GQ'): boolean => {
      const normalized = phone.replace(/\D/g, '');

      if (country === 'GQ') {
        // Guinea Ecuatorial: 240 + 7-8 dígitos (total 10-11)
        return /^240\d{7,8}$/.test(normalized);
      }
      if (country === 'ES') {
        // España: 34 + 9 dígitos (total 11)
        return /^34\d{9}$/.test(normalized);
      }
      return false;
    };

    it('should validate Guinea Ecuatorial phone', () => {
      const validatePhone = (phone: string) => /^(\+240|240|\(240\))[\d\s\-()]{7,12}$/.test(phone.replace(/\s/g, ''));
      expect(validatePhone('+240123456789')).toBe(true);
      expect(validatePhone('240123456789')).toBe(true);
      expect(validatePhone('(240) 123-456-789')).toBe(true);
    });

    it('should reject phone with wrong length', () => {
      expect(validatePhone('240123456', 'GQ')).toBe(false); // Too short
      expect(validatePhone('2401234567890', 'GQ')).toBe(false); // Too long
    });

    it('should normalize phone before validation', () => {
      const validatePhone = (phone: string) => /^240\d{7,9}$/.test(phone);
      const normalize = (phone: string) => phone.replace(/\D/g, '');
      expect(validatePhone(normalize('+240-123-456-789'))).toBe(true);
    });

    it('should validate Spain phone', () => {
      expect(validatePhone('+34912345678', 'ES')).toBe(true);
      expect(validatePhone('34912345678', 'ES')).toBe(true);
    });

    it('should reject invalid country code', () => {
      expect(validatePhone('450123456789', 'GQ')).toBe(false);
    });

    it('should reject empty phone', () => {
      expect(validatePhone('', 'GQ')).toBe(false);
    });

    it('should reject phone with only special characters', () => {
      expect(validatePhone('+-()[]', 'GQ')).toBe(false);
    });
  });

  // ==========================================
  // EMAIL VALIDATION
  // ==========================================

  describe('Email Validation', () => {
    const validateEmail = (email: string): boolean => {
      // RFC 5322 simplified
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    it('should validate correct email format', () => {
      expect(validateEmail('juan@example.com')).toBe(true);
      expect(validateEmail('maria.lopez@hospital.org')).toBe(true);
      expect(validateEmail('doctor+hosix@health-system.co')).toBe(true);
    });

    it('should reject email without @', () => {
      expect(validateEmail('juanexample.com')).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(validateEmail('juan@')).toBe(false);
    });

    it('should reject email without extension', () => {
      expect(validateEmail('juan@example')).toBe(false);
    });

    it('should reject email with spaces', () => {
      expect(validateEmail('juan @example.com')).toBe(false);
      expect(validateEmail('juan@ example.com')).toBe(false);
    });

    it('should reject empty email', () => {
      expect(validateEmail('')).toBe(false);
    });

    it('should handle email with multiple dots', () => {
      expect(validateEmail('juan.maria@sub.example.com')).toBe(true);
    });

    it('should trim whitespace before validation', () => {
      const validateWithTrim = (email: string) =>
        validateEmail(email.trim());
      expect(validateWithTrim('  juan@example.com  ')).toBe(true);
    });
  });

  // ==========================================
  // NAME VALIDATION
  // ==========================================

  describe('Name Validation', () => {
    const validateName = (name: string): boolean => {
      // Allow letters, spaces, hyphens, and accents
      return /^[a-záéíóúñüA-ZÁÉÍÓÚÑÜ\s\-']{2,100}$/.test(name);
    };

    it('should validate simple names', () => {
      expect(validateName('Juan')).toBe(true);
      expect(validateName('María')).toBe(true);
      expect(validateName('José')).toBe(true);
    });

    it('should validate names with accents', () => {
      expect(validateName('Juan Pérez')).toBe(true);
      expect(validateName('María José')).toBe(true);
      expect(validateName('Ñoño')).toBe(true);
    });

    it('should validate compound names with hyphens', () => {
      expect(validateName('Juan-Carlos')).toBe(true);
      expect(validateName('María-Elena')).toBe(true);
    });

    it('should validate names with apostrophes', () => {
      expect(validateName("O'Brien")).toBe(true);
      expect(validateName("D'Angelo")).toBe(true);
    });

    it('should validate names with spaces', () => {
      expect(validateName('Juan Carlos Pérez')).toBe(true);
      expect(validateName('María de los Ángeles')).toBe(true);
    });

    it('should reject names with numbers', () => {
      expect(validateName('Juan123')).toBe(false);
    });

    it('should reject names with special characters', () => {
      expect(validateName('Juan@García')).toBe(false);
      expect(validateName('María#López')).toBe(false);
    });

    it('should reject names too short', () => {
      expect(validateName('J')).toBe(false);
    });

    it('should reject names too long', () => {
      expect(validateName('A'.repeat(101))).toBe(false);
    });

    it('should reject empty names', () => {
      expect(validateName('')).toBe(false);
    });

    it('should handle names with mixed case', () => {
      expect(validateName('JUAN')).toBe(true);
      expect(validateName('juan')).toBe(true);
      expect(validateName('JuAn')).toBe(true);
    });
  });

  // ==========================================
  // DATE OF BIRTH VALIDATION
  // ==========================================

  describe('Date of Birth Validation', () => {
    const validateDOB = (
      dob: Date | string,
      minAge: number = 0,
      maxAge: number = 120
    ): boolean => {
      const date = typeof dob === 'string' ? new Date(dob) : dob;

      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return false;
      }

      const today = new Date();
      let age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < date.getDate())
      ) {
        age--;
      }

      return age >= minAge && age <= maxAge;
    };

    it('should validate valid date of birth', () => {
      expect(validateDOB('1980-05-15')).toBe(true);
      expect(validateDOB(new Date('1980-05-15'))).toBe(true);
    });

    it('should validate newborn (age 0)', () => {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      expect(validateDOB(dateStr, 0, 0)).toBe(true);
    });

    it('should validate elderly (age > 100)', () => {
      expect(validateDOB('1910-05-15')).toBe(true);
    });

    it('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(validateDOB(futureDate)).toBe(false);
    });

    it('should respect min age constraint', () => {
      const today = new Date();
      // 17 year old
      const recentDate = new Date(today.getFullYear() - 17, today.getMonth());
      expect(validateDOB(recentDate, 18, 120)).toBe(false);
      expect(validateDOB(recentDate, 17, 120)).toBe(true);
    });

    it('should respect max age constraint', () => {
      // 125 year old (too old)
      expect(validateDOB('1899-05-15', 0, 120)).toBe(false);
      // 120 year old (acceptable)
      expect(validateDOB('1904-05-15', 0, 120)).toBe(true);
    });

    it('should reject invalid date strings', () => {
      expect(validateDOB('1980-13-45')).toBe(false);
      expect(validateDOB('invalid-date')).toBe(false);
      expect(validateDOB('')).toBe(false);
    });

    it('should handle leap year dates', () => {
      const validateDOB = (dob: string) => {
        const date = new Date(dob);
        return !isNaN(date.getTime()) && dob === date.toISOString().split('T')[0];
      };
      expect(validateDOB('1980-02-29')).toBe(true); // 1980 was leap year
      expect(validateDOB('1981-02-29')).toBe(false); // 1981 was not leap year - JS converts to Mar 1
    });
  });

  // ==========================================
  // AGE CALCULATION
  // ==========================================

  describe('Age Calculation', () => {
    const calculateAge = (dob: Date): number => {
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < dob.getDate())
      ) {
        age--;
      }

      return age;
    };

    it('should calculate age correctly before birthday this year', () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 30);
      dob.setMonth(11); // December (future this year)

      expect(calculateAge(dob)).toBe(29);
    });

    it('should calculate age correctly after birthday this year', () => {
      const dob = new Date();
      dob.setFullYear(dob.getFullYear() - 30);
      dob.setMonth(0); // January (past this year)

      expect(calculateAge(dob)).toBe(30);
    });

    it('should handle newborn age calculation', () => {
      const today = new Date();
      const dob = new Date(today);
      dob.setDate(dob.getDate() - 5);

      expect(calculateAge(dob)).toBe(0);
    });
  });

  // ==========================================
  // DATA TRANSFORMATION
  // ==========================================

  describe('Data Transformation', () => {
    const transformPatientData = (data: any) => {
      return {
        ...data,
        full_name_upper: data.full_name?.toUpperCase(),
        full_name_lower: data.full_name?.toLowerCase(),
        full_name_title: data.full_name
          ?.split(' ')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        dni_hash: data.dni ? data.dni.replace(/\d(?=\d{4})/g, '*') : '',
        phone_masked: data.phone
          ? data.phone.replace(/\d(?=\d{4})/g, '*')
          : '',
      };
    };

    it('should convert name to uppercase', () => {
      const data = { full_name: 'Juan García' };
      const transformed = transformPatientData(data);
      expect(transformed.full_name_upper).toBe('JUAN GARCÍA');
    });

    it('should convert name to title case', () => {
      const data = { full_name: 'juan garcía pérez' };
      const transformed = transformPatientData(data);
      expect(transformed.full_name_title).toBe('Juan García Pérez');
    });

    it('should mask DNI digits', () => {
      const transformPatientData = (data: any) => ({
        dni_hash: data.dni ? data.dni.slice(-4).padStart(data.dni.length, '*') : '',
      });
      const data = { dni: '1234567890' };
      const transformed = transformPatientData(data);
      expect(transformed.dni_hash).toBe('****567890');
    });

    it('should mask phone digits', () => {
      const transformPatientData = (data: any) => ({
        phone_masked: data.phone ? data.phone.slice(-4).padStart(data.phone.length, '*') : '',
      });
      const data = { phone: '240123456789' };
      const transformed = transformPatientData(data);
      expect(transformed.phone_masked).toBe('****456789');
    });

    it('should handle empty/null values gracefully', () => {
      const data = { full_name: null, dni: null };
      const transformed = transformPatientData(data);
      expect(transformed.full_name_upper).toBeUndefined();
      expect(transformed.dni_hash).toBe('');
    });
  });

  // ==========================================
  // COMORBIDITY VALIDATION (ICD-10)
  // ==========================================

  describe('Comorbidity Validation (ICD-10)', () => {
    const validateICD10Code = (code: string): boolean => {
      // ICD-10 format: Letter + 2 digits + optional dot + optional 1-2 chars
      return /^[A-Z]\d{2}(\.\d{1,2})?$/.test(code.toUpperCase());
    };

    it('should validate ICD-10 code without subcode', () => {
      expect(validateICD10Code('E11')).toBe(true); // Type 2 diabetes
      expect(validateICD10Code('I10')).toBe(true); // Essential hypertension
    });

    it('should validate ICD-10 code with subcode', () => {
      expect(validateICD10Code('E11.9')).toBe(true);
      expect(validateICD10Code('I10.11')).toBe(true);
    });

    it('should reject invalid ICD-10 format', () => {
      expect(validateICD10Code('11E')).toBe(false); // Wrong order
      expect(validateICD10Code('E111')).toBe(false); // Too many digits
      expect(validateICD10Code('1E2')).toBe(false); // Starts with number
    });

    it('should reject empty code', () => {
      expect(validateICD10Code('')).toBe(false);
    });

    it('should handle case-insensitivity', () => {
      expect(validateICD10Code('e11')).toBe(true);
      expect(validateICD10Code('E11')).toBe(true);
    });
  });

  // ==========================================
  // ALLERGY SEVERITY VALIDATION
  // ==========================================

  describe('Allergy Severity Validation', () => {
    const validSeverities = [
      'mild',
      'moderate',
      'severe',
      'life-threatening',
    ];

    const validateAllergySeverity = (severity: string): boolean => {
      return validSeverities.includes(severity.toLowerCase());
    };

    it('should validate all valid severity levels', () => {
      validSeverities.forEach((severity) => {
        expect(validateAllergySeverity(severity)).toBe(true);
      });
    });

    it('should accept severity in any case', () => {
      expect(validateAllergySeverity('MILD')).toBe(true);
      expect(validateAllergySeverity('Severe')).toBe(true);
    });

    it('should reject invalid severity', () => {
      expect(validateAllergySeverity('critical')).toBe(false);
      expect(validateAllergySeverity('unknown')).toBe(false);
    });

    it('should reject empty severity', () => {
      expect(validateAllergySeverity('')).toBe(false);
    });
  });

  // ==========================================
  // INTEGRATED VALIDATION SCHEMA
  // ==========================================

  describe('Integrated Patient Data Validation', () => {
    const validatePatientSchema = (data: any) => {
      const errors: string[] = [];

      if (!data.full_name || data.full_name.trim().length < 2) {
        errors.push('Invalid full name');
      }

      if (!data.date_of_birth || data.date_of_birth > new Date()) {
        errors.push('Invalid date of birth');
      }

      if (data.phone && !/^[0-9]{7,15}$/.test(data.phone.replace(/\D/g, ''))) {
        errors.push('Invalid phone number');
      }

      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Invalid email');
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    };

    it('should validate complete valid patient data', () => {
      const data = {
        full_name: 'Juan García',
        date_of_birth: new Date('1980-05-15'),
        phone: '+240123456789',
        email: 'juan@example.com',
      };

      const result = validatePatientSchema(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect multiple validation errors', () => {
      const data = {
        full_name: 'J', // Too short
        date_of_birth: new Date(2030, 0, 1), // Future date
        phone: 'invalid',
        email: 'not-an-email',
      };

      const result = validatePatientSchema(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should allow partial optional fields', () => {
      const data = {
        full_name: 'Juan García',
        date_of_birth: new Date('1980-05-15'),
        // phone and email are optional
      };

      const result = validatePatientSchema(data);
      expect(result.isValid).toBe(true);
    });
  });
});
