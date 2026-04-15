// @ts-nocheck
/**
 * DrugBank Integration Service
 * Integración con DrugBank API para información de medicamentos e interacciones
 */

export interface DrugBankDrug {
  drugbank_id: string;
  name: string;
  description?: string;
  type?: string;
  groups?: string[];
  targets?: DrugTarget[];
  interactions?: DrugInteraction[];
  dosages?: DosageInfo[];
  contraindications?: string[];
  adverse_effects?: string[];
}

export interface DrugTarget {
  name: string;
  actions?: string[];
}

export interface DrugInteraction {
  drugbank_id: string;
  name: string;
  description: string;
  severity?: 'mild' | 'moderate' | 'severe' | 'contraindicated';
}

export interface DosageInfo {
  indication: string;
  dosage: string;
  route: string;
}

/**
 * DrugBank API Service
 * Nota: DrugBank requiere autenticación. Para producción, usar API key.
 * Para desarrollo, podemos usar datos locales o mock.
 */
export class DrugBankService {
  private apiKey?: string;
  private baseUrl = 'https://api.drugbank.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.VITE_DRUGBANK_API_KEY;
  }

  /**
   * Busca información de un medicamento por nombre o principio activo
   */
  async searchDrug(query: string): Promise<DrugBankDrug[]> {
    if (!this.apiKey) {
      // Modo desarrollo: retornar datos mock
      return this.getMockDrugs(query);
    }

    try {
      const response = await fetch(`${this.baseUrl}/drugs?q=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`DrugBank API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.drugs || [];
    } catch (error) {
      console.error('Error fetching DrugBank data:', error);
      // Fallback a datos mock
      return this.getMockDrugs(query);
    }
  }

  /**
   * Obtiene información detallada de un medicamento por DrugBank ID
   */
  async getDrugById(drugbankId: string): Promise<DrugBankDrug | null> {
    if (!this.apiKey) {
      return this.getMockDrugById(drugbankId);
    }

    try {
      const response = await fetch(`${this.baseUrl}/drugs/${drugbankId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching drug details:', error);
      return this.getMockDrugById(drugbankId);
    }
  }

  /**
   * Verifica interacciones entre medicamentos
   */
  async checkInteractions(drugIds: string[]): Promise<DrugInteraction[]> {
    if (!this.apiKey || drugIds.length < 2) {
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/interactions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ drug_ids: drugIds }),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.interactions || [];
    } catch (error) {
      console.error('Error checking interactions:', error);
      return [];
    }
  }

  /**
   * Obtiene información de dosificación recomendada
   */
  async getDosageInfo(drugbankId: string, indication?: string): Promise<DosageInfo[]> {
    if (!this.apiKey) {
      return this.getMockDosageInfo(drugbankId);
    }

    try {
      const url = indication
        ? `${this.baseUrl}/drugs/${drugbankId}/dosages?indication=${encodeURIComponent(indication)}`
        : `${this.baseUrl}/drugs/${drugbankId}/dosages`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.dosages || [];
    } catch (error) {
      console.error('Error fetching dosage info:', error);
      return this.getMockDosageInfo(drugbankId);
    }
  }

  // Métodos mock para desarrollo sin API key
  private getMockDrugs(query: string): DrugBankDrug[] {
    const mockDrugs: Record<string, DrugBankDrug> = {
      paracetamol: {
        drugbank_id: 'DB00316',
        name: 'Paracetamol',
        description: 'Analgésico y antipirético',
        type: 'small molecule',
        groups: ['approved'],
        interactions: [
          {
            drugbank_id: 'DB01015',
            name: 'Warfarin',
            description: 'Puede aumentar el riesgo de sangrado',
            severity: 'moderate',
          },
        ],
        dosages: [
          {
            indication: 'Dolor y fiebre',
            dosage: '500-1000mg',
            route: 'Oral',
          },
        ],
      },
      amoxicilina: {
        drugbank_id: 'DB01060',
        name: 'Amoxicillin',
        description: 'Antibiótico betalactámico',
        type: 'small molecule',
        groups: ['approved'],
        interactions: [
          {
            drugbank_id: 'DB00316',
            name: 'Paracetamol',
            description: 'Sin interacción clínica significativa',
            severity: 'mild',
          },
        ],
        dosages: [
          {
            indication: 'Infección bacteriana',
            dosage: '500mg cada 8 horas',
            route: 'Oral',
          },
        ],
      },
    };

    const lowerQuery = query.toLowerCase();
    return Object.values(mockDrugs).filter(
      (drug) =>
        drug.name.toLowerCase().includes(lowerQuery) ||
        drug.drugbank_id.toLowerCase().includes(lowerQuery)
    );
  }

  private getMockDrugById(drugbankId: string): DrugBankDrug | null {
    const drugs = this.getMockDrugs(drugbankId);
    return drugs[0] || null;
  }

  private getMockDosageInfo(drugbankId: string): DosageInfo[] {
    const drug = this.getMockDrugById(drugbankId);
    return drug?.dosages || [];
  }
}

// Instancia singleton
export const drugBankService = new DrugBankService();

