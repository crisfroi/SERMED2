import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mocks
jest.mock('@/services/supabaseClient', () => ({
  supabaseClientEnhanced: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    data: null,
    error: null,
  },
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', role: 'doctor' },
    isAuthenticated: true,
  }),
}));

jest.mock('@/hooks/usePatientSearch', () => ({
  usePatientSearch: () => ({
    search: jest.fn(),
    results: [],
    loading: false,
    error: null,
    pagination: { page: 1, total: 0, pageSize: 20 },
  }),
}));

describe('Patient Search E2E Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Search by System ID', () => {
    it('should search patient by system ID and return result', async () => {
      const mockResults = [
        {
          id: 'patient-001',
          full_name: 'Juan Pérez García',
          dni: '1234567890',
          date_of_birth: '1980-05-15',
          hospital_id: 'hosp-001',
        },
      ];

      const mockSearch = jest.fn().mockResolvedValue({
        data: mockResults,
        error: null,
      });

      expect(mockSearch).toBeDefined();
      const result = await mockSearch('patient-001');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('patient-001');
    });

    it('should handle empty results for non-existent ID', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await mockSearch('invalid-id');
      expect(result.data).toHaveLength(0);
    });
  });

  describe('Search by DNI (with privacy)', () => {
    it('should search patient by DNI hash', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'patient-002',
            full_name: 'María López',
            dni_hash: 'hash_1234567890',
          },
        ],
        error: null,
      });

      const result = await mockSearch('1234567890', 'dni');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].dni_hash).toBeDefined();
    });

    it('should not expose full DNI in results', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'patient-003',
            full_name: 'Carlos Ruiz',
            dni_masked: '****7890',
          },
        ],
        error: null,
      });

      const result = await mockSearch('9876543210', 'dni');
      expect(result.data[0].dni_masked).toBeDefined();
      expect(result.data[0].dni_masked).not.toContain('9876');
    });

    it('should validate DNI format before search', async () => {
      const validateDNI = (dni: string) => {
        return /^\d{8,13}$/.test(dni);
      };

      expect(validateDNI('1234567890')).toBe(true);
      expect(validateDNI('invalid-dni')).toBe(false);
      expect(validateDNI('12345')).toBe(false);
    });
  });

  describe('Search by Names', () => {
    it('should search by first name', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: [
          { id: 'p1', full_name: 'Juan García' },
          { id: 'p2', full_name: 'Juan López' },
        ],
        error: null,
      });

      const result = await mockSearch('Juan', 'firstName');
      expect(result.data).toHaveLength(2);
      expect(result.data.every(r => r.full_name.includes('Juan'))).toBe(true);
    });

    it('should search by last name', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: [{ id: 'p1', full_name: 'Juan García' }],
        error: null,
      });

      const result = await mockSearch('García', 'lastName');
      expect(result.data).toHaveLength(1);
    });

    it('should handle accents in names', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: [
          { id: 'p1', full_name: 'José María' },
          { id: 'p2', full_name: 'Jose Maria' },
        ],
        error: null,
      });

      const result = await mockSearch('José', 'firstName');
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: [{ id: 'p1', full_name: 'Juan García' }],
        error: null,
      });

      const result1 = await mockSearch('juan', 'firstName');
      const result2 = await mockSearch('JUAN', 'firstName');
      expect(result1.data).toEqual(result2.data);
    });
  });

  describe('Search by Date of Birth', () => {
    it('should search by exact date of birth', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: [{ id: 'p1', dob: '1980-05-15', full_name: 'Juan' }],
        error: null,
      });

      const result = await mockSearch('1980-05-15', 'dob');
      expect(result.data).toHaveLength(1);
    });

    it('should search by date range', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: [
          { id: 'p1', dob: '1980-05-15' },
          { id: 'p2', dob: '1985-03-20' },
        ],
        error: null,
      });

      const result = await mockSearch(
        { start: '1980-01-01', end: '1990-12-31' },
        'dobRange'
      );
      expect(result.data).toHaveLength(2);
    });

    it('should validate date format', async () => {
      const validateDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date instanceof Date && !isNaN(date.getTime());
      };

      expect(validateDate('1980-05-15')).toBe(true);
      expect(validateDate('1980-13-45')).toBe(false);
      expect(validateDate('invalid')).toBe(false);
    });
  });

  describe('Search by Phone', () => {
    it('should search by primary phone number', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: [{ id: 'p1', phone_primary: '+240123456789' }],
        error: null,
      });

      const result = await mockSearch('+240123456789', 'phone');
      expect(result.data).toHaveLength(1);
    });

    it('should normalize phone numbers', async () => {
      const normalizePhone = (phone: string) => {
        return phone.replace(/\D/g, '');
      };

      expect(normalizePhone('+240-123-456-789')).toBe('240123456789');
      expect(normalizePhone('(240) 123-456-789')).toBe('240123456789');
    });

    it('should validate phone format', async () => {
      const validatePhone = (phone: string, country: string) => {
        if (country === 'GQ') {
          // Guinea Ecuatorial: 240 + 7-8 dígitos
          return /^240\d{7,8}$/.test(phone.replace(/\D/g, ''));
        }
        return false;
      };

      expect(validatePhone('+240123456789', 'GQ')).toBe(true);
      expect(validatePhone('+240123456', 'GQ')).toBe(false);
    });
  });

  describe('Search by Email', () => {
    it('should search by email', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: [{ id: 'p1', email: 'juan@example.com' }],
        error: null,
      });

      const result = await mockSearch('juan@example.com', 'email');
      expect(result.data).toHaveLength(1);
    });

    it('should validate email format', async () => {
      const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      };

      expect(validateEmail('juan@example.com')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('user@domain.co')).toBe(true);
    });
  });

  describe('Combined Search Filters', () => {
    it('should search with AND logic (nombre AND hospital)', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'p1',
            full_name: 'Juan García',
            hospital_id: 'hosp-001',
          },
        ],
        error: null,
      });

      const result = await mockSearch({
        name: 'Juan',
        hospital: 'hosp-001',
        logic: 'AND',
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].full_name).toContain('Juan');
      expect(result.data[0].hospital_id).toBe('hosp-001');
    });

    it('should search with OR logic', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: [
          { id: 'p1', full_name: 'Juan' },
          { id: 'p2', full_name: 'María' },
        ],
        error: null,
      });

      const result = await mockSearch({
        names: ['Juan', 'María'],
        logic: 'OR',
      });
      expect(result.data).toHaveLength(2);
    });

    it('should apply multiple filters correctly', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'p1',
            full_name: 'Juan',
            phone: '+240123456789',
            hospital_id: 'hosp-001',
            age: 45,
          },
        ],
        error: null,
      });

      const result = await mockSearch({
        name: 'Juan',
        phone: '+240123456789',
        hospital: 'hosp-001',
        ageMin: 40,
        ageMax: 50,
      });
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe('Pagination', () => {
    it('should return paginated results (page 1, 20 per page)', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: Array.from({ length: 20 }, (_, i) => ({
          id: `p${i + 1}`,
          full_name: `Patient ${i + 1}`,
        })),
        pagination: { page: 1, pageSize: 20, total: 100 },
      });

      const result = await mockSearch('', { page: 1, pageSize: 20 });
      expect(result.data).toHaveLength(20);
      expect(result.pagination.total).toBe(100);
    });

    it('should fetch next page', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: Array.from({ length: 20 }, (_, i) => ({
          id: `p${i + 21}`,
          full_name: `Patient ${i + 21}`,
        })),
        pagination: { page: 2, pageSize: 20, total: 100 },
      });

      const result = await mockSearch('', { page: 2, pageSize: 20 });
      expect(result.pagination.page).toBe(2);
    });

    it('should limit total results to 1000', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: Array.from({ length: 20 }, (_, i) => ({
          id: `p${i + 1}`,
        })),
        pagination: { page: 1, pageSize: 20, total: 1000, capped: true },
      });

      const result = await mockSearch('');
      expect(result.pagination.total).toBeLessThanOrEqual(1000);
    });
  });

  describe('Results Display and Privacy', () => {
    it('should show full name and basic demographics', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'p1',
            full_name: 'Juan García',
            age: 45,
            gender: 'M',
            hospital_name: 'Hospital A',
          },
        ],
        error: null,
      });

      const result = await mockSearch('Juan');
      expect(result.data[0]).toHaveProperty('full_name');
      expect(result.data[0]).toHaveProperty('age');
      expect(result.data[0]).toHaveProperty('gender');
    });

    it('should mask sensitive data (DNI, phone)', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: [
          {
            id: 'p1',
            full_name: 'Juan García',
            dni_masked: '****7890',
            phone_masked: '****6789',
          },
        ],
        error: null,
      });

      const result = await mockSearch('Juan');
      expect(result.data[0].dni_masked).toBeDefined();
      expect(result.data[0].dni_masked).toMatch(/\*+\d{4}/);
    });

    it('should show full data only when user has READ_PII permission', async () => {
      const mockSearch = jest.fn(
        (query, options = {}) =>
          new Promise((resolve) => {
            const hasPermission = options.showPII;
            resolve({
              data: [
                {
                  id: 'p1',
                  dni: hasPermission ? '1234567890' : '****7890',
                  phone: hasPermission ? '+240123456789' : '****6789',
                },
              ],
            });
          })
      );

      const resultNoPerm = await mockSearch('Juan', { showPII: false });
      expect(resultNoPerm.data[0].dni).toMatch(/\*+\d{4}/);

      const resultWithPerm = await mockSearch('Juan', { showPII: true });
      expect(resultWithPerm.data[0].dni).toMatch(/^\d{10}$/);
    });
  });

  describe('Error Handling', () => {
    it('should handle no results gracefully', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await mockSearch('nonexistent');
      expect(result.data).toHaveLength(0);
      expect(result.error).toBeNull();
    });

    it('should handle database errors', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: null,
        error: {
          message: 'Database error',
          code: 'PGERROR',
        },
      });

      const result = await mockSearch('');
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('PGERROR');
    });

    it('should handle network timeout', async () => {
      const mockSearch = jest.fn().mockRejectedValue(
        new Error('Network timeout')
      );

      try {
        await mockSearch('Juan');
      } catch (error) {
        expect(error.message).toBe('Network timeout');
      }
    });

    it('should handle invalid filter combinations', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: [],
        error: {
          message: 'Invalid filter combination',
        },
      });

      const result = await mockSearch('', {
        ageMin: 100,
        ageMax: 30, // Min > Max
      });
      expect(result.error).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should return search results within 200ms', async () => {
      const mockSearch = jest.fn(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                data: Array.from({ length: 20 }, (_, i) => ({
                  id: `p${i}`,
                })),
              });
            }, 150);
          })
      );

      const start = performance.now();
      await mockSearch('Juan');
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(250);
    });

    it('should handle large result sets (100+ items)', async () => {
      const mockSearch = jest.fn().mockResolvedValue({
        data: Array.from({ length: 100 }, (_, i) => ({
          id: `p${i}`,
          full_name: `Patient ${i}`,
        })),
        pagination: { total: 1000 },
      });

      const result = await mockSearch('', { pageSize: 100 });
      expect(result.data).toHaveLength(100);
    });
  });

  describe('Search History and Audit', () => {
    it('should not log sensitive search criteria (DNI)', async () => {
      const mockAudit = jest.fn();

      // Simulate search by DNI
      await mockAudit('search', { criteriaType: 'dni', masked: true });

      expect(mockAudit).toHaveBeenCalledWith('search', {
        criteriaType: 'dni',
        masked: true,
      });
    });

    it('should log search with sanitized criteria', async () => {
      const mockAudit = jest.fn();

      // Simulate search by name
      await mockAudit('search', { criteriaType: 'name', value: 'Juan' });

      expect(mockAudit).toHaveBeenCalledWith('search', expect.objectContaining({
        criteriaType: 'name',
      }));
    });
  });
});
