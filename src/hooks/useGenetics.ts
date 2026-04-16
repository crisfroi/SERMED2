import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export interface GeneticTest {
  patient_id: string;
  test_type:
    | 'carrier_screening'
    | 'diagnostic'
    | 'prenatal'
    | 'cancer_predisposition'
    | 'pharmacogenomics'
    | 'ancestry'
    | 'whole_genome'
    | 'targeted_panel';
  test_date: string;
  specimen_type: 'blood' | 'saliva' | 'buccal_swab' | 'tissue' | 'amniotic_fluid';
  genes_analyzed: string[];
  results_received_date?: string;
  result_status: 'pending' | 'received' | 'interpreted' | 'reported';
  clinical_significance: 'benign' | 'likely_benign' | 'vus' | 'likely_pathogenic' | 'pathogenic';
  findings: string[];
  counseling_provided: boolean;
}

export interface FamilyHistory {
  patient_id: string;
  relative_type: 'mother' | 'father' | 'sibling' | 'child' | 'grandparent' | 'aunt_uncle' | 'cousin';
  relative_age?: number;
  conditions: Array<{
    condition_name: string;
    age_of_onset?: number;
    status: 'alive' | 'deceased';
  }>;
  genetic_risk_noted: boolean;
  notes?: string;
}

export interface GeneticRiskAssessment {
  patient_id: string;
  assessment_date: string;
  conditions_evaluated: string[];
  family_history_risk_level: 'low' | 'moderate' | 'high' | 'very_high';
  estimated_risk_percentage?: number;
  recommended_tests: string[];
  cancer_predisposition_genes?: string[]; // e.g., BRCA1, BRCA2, Lynch syndrome genes
  carrier_status?: Record<string, 'carrier' | 'non_carrier' | 'unknown'>;
  recommendations: string[];
  referral_needed: boolean;
  referral_specialty?: string;
}

export const useGenetics = () => {
  const recordGeneticTest = async (
    test: Omit<GeneticTest, 'id'>
  ): Promise<GeneticTest | null> => {
    try {
      // Default status to pending if not provided
      const geneticTest: GeneticTest = {
        ...test,
        result_status: test.result_status || 'pending',
      };

      const { data, error } = await supabase
        .from('genetics_genetic_tests')
        .insert([geneticTest])
        .select();

      if (error) throw error;

      // Determine severity based on significance
      const severityMap = {
        benign: 'low',
        likely_benign: 'low',
        vus: 'medium',
        likely_pathogenic: 'high',
        pathogenic: 'high',
      };

      await supabase.from('ehr_audit_trail').insert([
        {
          action: 'record_genetic_test',
          table_name: 'genetics_genetic_tests',
          record_id: data?.[0]?.id,
          patient_id: test.patient_id,
          details: `Genetic test: ${test.test_type} - ${test.genes_analyzed.join(', ')}`,
          severity: severityMap[test.clinical_significance] || 'medium',
        },
      ]);

      return data?.[0] || geneticTest;
    } catch (error) {
      console.error('Error recording genetic test:', error);
      return null;
    }
  };

  const recordFamilyHistory = async (
    history: Omit<FamilyHistory, 'id'>
  ): Promise<FamilyHistory | null> => {
    try {
      const { data, error } = await supabase
        .from('genetics_family_history')
        .insert([history])
        .select();

      if (error) throw error;

      await supabase.from('ehr_audit_trail').insert([
        {
          action: 'record_family_history',
          table_name: 'genetics_family_history',
          record_id: data?.[0]?.id,
          patient_id: history.patient_id,
          details: `Family history documented: ${history.relative_type} with ${history.conditions.map((c) => c.condition_name).join(', ')}`,
          severity: history.genetic_risk_noted ? 'medium' : 'low',
        },
      ]);

      return data?.[0] || history;
    } catch (error) {
      console.error('Error recording family history:', error);
      return null;
    }
  };

  const performRiskAssessment = async (
    patientId: string
  ): Promise<GeneticRiskAssessment | null> => {
    try {
      // Fetch family history
      const { data: familyHistoryData, error: familyError } = await supabase
        .from('genetics_family_history')
        .select('*')
        .eq('patient_id', patientId);

      // Fetch prior genetic tests
      const { data: tests, error: testError } = await supabase
        .from('genetics_genetic_tests')
        .select('*')
        .eq('patient_id', patientId);

      if (familyError || testError) throw familyError || testError;

      // Calculate risk level based on family history
      let riskLevel: GeneticRiskAssessment['family_history_risk_level'] = 'low';
      const pathogenicFindings = tests?.filter(
        (t) => t.clinical_significance === 'pathogenic' || t.clinical_significance === 'likely_pathogenic'
      );

      const familyWithGeneticRisk = (familyHistoryData || []).filter((f) => f.genetic_risk_noted);

      if (pathogenicFindings && pathogenicFindings.length > 0) {
        riskLevel = 'very_high';
      } else if (familyWithGeneticRisk.length >= 2) {
        riskLevel = 'high';
      } else if (familyWithGeneticRisk.length >= 1) {
        riskLevel = 'moderate';
      }

      // Extract cancer predisposition genes if relevant
      const cancerGenes = ['BRCA1', 'BRCA2', 'MLH1', 'MSH2', 'MSH6', 'TP53', 'PTEN'];
      const relevantCancerGenes = tests
        ?.filter(
          (t) =>
            t.test_type === 'cancer_predisposition' && t.genes_analyzed.some((g) => cancerGenes.includes(g))
        )
        .flatMap((t) => t.genes_analyzed) || [];

      const assessment: GeneticRiskAssessment = {
        patient_id: patientId,
        assessment_date: new Date().toISOString(),
        conditions_evaluated: tests?.flatMap((t) => t.genes_analyzed) || [],
        family_history_risk_level: riskLevel,
        estimated_risk_percentage:
          riskLevel === 'very_high' ? 75 : riskLevel === 'high' ? 50 : riskLevel === 'moderate' ? 25 : 5,
        recommended_tests:
          riskLevel === 'high' || riskLevel === 'very_high'
            ? ['Comprehensive genetic panel', 'Genetic counseling', 'Carrier screening']
            : [],
        cancer_predisposition_genes: relevantCancerGenes,
        carrier_status: tests
          ?.filter((t) => t.test_type === 'carrier_screening' && t.result_status === 'interpreted')
          .reduce(
            (acc, t) => {
              t.genes_analyzed.forEach((gene) => {
                acc[gene] = t.clinical_significance === 'benign' ? 'non_carrier' : 'carrier';
              });
              return acc;
            },
            {} as Record<string, 'carrier' | 'non_carrier' | 'unknown'>
          ) || {},
        recommendations: [
          riskLevel === 'very_high'
            ? '🔴 Very high genetic risk - Urgent subspecialty referral'
            : null,
          riskLevel === 'high'
            ? '🟡 High genetic risk - Schedule genetic counseling'
            : null,
          relevantCancerGenes.length > 0 ? '💡 Cancer surveillance protocol recommended' : null,
          familyWithGeneticRisk.length >= 2
            ? '💡Consider preventive genetic testing for family members'
            : null,
        ].filter(Boolean) as string[],
        referral_needed: riskLevel === 'high' || riskLevel === 'very_high',
        referral_specialty: relevantCancerGenes.length > 0 ? 'Oncogenetics' : 'Clinical Genetics',
      };

      return assessment;
    } catch (error) {
      console.error('Error performing genetic risk assessment:', error);
      return null;
    }
  };

  const identifyRecurrencyRisk = async (patientId: string, condition: string) => {
    try {
      const { data: familyHistory, error } = await supabase
        .from('genetics_family_history')
        .select('*')
        .eq('patient_id', patientId);

      if (error) throw error;

      // Count relatives with same condition
      const affectedRelatives = familyHistory?.filter((fh) =>
        fh.conditions.some((c) => c.condition_name.toLowerCase().includes(condition.toLowerCase()))
      ) || [];

      const recurencyRisk = {
        conditionName: condition,
        affectedRelativesCount: affectedRelatives.length,
        riskPercentage: Math.min(50, 5 + affectedRelatives.length * 10),
        inheritancePattern: affectedRelatives.length > 0 ? 'Familial' : 'Sporadic',
        recommendations: [
          affectedRelatives.length > 1
            ? '💡Likely inherited condition - recommend family screening'
            : null,
          affectedRelatives.length > 3
            ? '🔴Autosomal dominant pattern suspected'
            : null,
        ].filter(Boolean),
      };

      return recurencyRisk;
    } catch (error) {
      console.error('Error identifying recurrency risk:', error);
      return null;
    }
  };

  return {
    recordGeneticTest,
    recordFamilyHistory,
    performRiskAssessment,
    identifyRecurrencyRisk,
  };
};
