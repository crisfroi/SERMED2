import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Loader, Search } from 'lucide-react';
import { useDiagnosisManagement } from '@hosix/hooks/08-diagnoses/useDiagnosisManagement';

const diagnosisFormSchema = z.object({
  icd10Code: z.string().min(3, 'Código ICD-10 requerido'),
  severity: z.enum(['mild', 'moderate', 'severe']),
  onsetType: z.enum(['acute', 'chronic', 'subacute', 'remote']),
  clinicalPresentation: z.string().min(10, 'Presentación clínica requerida'),
  relevantHistory: z.string().optional(),
  physicalExamFindings: z.string().optional(),
  primaryDiagnosis: z.boolean().default(false),
});

type DiagnosisFormValues = z.infer<typeof diagnosisFormSchema>;

interface DiagnosisOption {
  id: string;
  code: string;
  description: string;
  category: string;
  isChronic: boolean;
}

interface DiagnosisFormProps {
  patientId: string;
  onSuccess?: (diagnosisId: string) => void;
}

const SEVERITY_OPTIONS = [
  { value: 'mild', label: 'Leve' },
  { value: 'moderate', label: 'Moderada' },
  { value: 'severe', label: 'Severa' },
];

const ONSET_OPTIONS = [
  { value: 'acute', label: 'Aguda' },
  { value: 'chronic', label: 'Crónica' },
  { value: 'subacute', label: 'Subaguda' },
  { value: 'remote', label: 'Remota' },
];

export function DiagnosisForm({ patientId, onSuccess }: DiagnosisFormProps) {
  const [icd10Codes, setIcd10Codes] = useState<DiagnosisOption[]>([]);
  const [filteredCodes, setFilteredCodes] = useState<DiagnosisOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCodeList, setShowCodeList] = useState(false);

  const { createDiagnosis } = useDiagnosisManagement(patientId);

  const form = useForm<DiagnosisFormValues>({
    resolver: zodResolver(diagnosisFormSchema),
    defaultValues: {
      severity: 'moderate',
      onsetType: 'acute',
      primaryDiagnosis: false,
    },
  });

  // Load ICD-10 codes
  useEffect(() => {
    const loadCodes = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('icd10_codes')
          .select('id, code, description, category, chronic')
          .limit(500)
          .order('code');

        if (error) throw error;
        setIcd10Codes(data || []);
      } catch (err: any) {
        setErrors([err.message || 'Error loading ICD-10 codes']);
      } finally {
        setLoading(false);
      }
    };

    loadCodes();
  }, []);

  // Filter codes based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCodes([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = icd10Codes.filter(
      (code) =>
        code.code.toLowerCase().includes(term) ||
        code.description.toLowerCase().includes(term)
    );

    setFilteredCodes(filtered.slice(0, 20));
  }, [searchTerm, icd10Codes]);

  const onSubmit = async (values: DiagnosisFormValues) => {
    try {
      setSubmitLoading(true);
      setErrors([]);

      const diagnosisId = await createDiagnosis({
        icd10Code: values.icd10Code,
        severity: values.severity,
        onsetType: values.onsetType,
        clinicalPresentation: values.clinicalPresentation,
        relevantHistory: values.relevantHistory,
        physicalExamFindings: values.physicalExamFindings,
        primaryDiagnosis: values.primaryDiagnosis,
      });

      setSubmitSuccess(true);
      form.reset();
      onSuccess?.(diagnosisId);

      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err: any) {
      setErrors([err.message || 'Error creating diagnosis']);
    } finally {
      setSubmitLoading(false);
    }
  };

  const selectedCode = icd10Codes.find((c) => c.code === form.watch('icd10Code'));

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Cargando códigos ICD-10...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Nuevo Diagnóstico</h2>
        <p className="mt-1 text-sm text-gray-600">
          Complete los campos para registrar un diagnóstico
        </p>
      </div>

      {submitSuccess && (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="ml-2 text-green-800">
            ¡Diagnóstico registrado exitosamente!
          </AlertDescription>
        </Alert>
      )}

      {errors.length > 0 && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <ul className="ml-2 space-y-1 text-red-800">
              {errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* ICD-10 Code Selection */}
          <FormField
            control={form.control}
            name="icd10Code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código ICD-10 *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Busca por código o descripción (ej: I10, hipertensión)"
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowCodeList(true);
                          }}
                          onFocus={() => setShowCodeList(true)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    {showCodeList && filteredCodes.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                        {filteredCodes.map((code) => (
                          <button
                            key={code.id}
                            type="button"
                            onClick={() => {
                              field.onChange(code.code);
                              setSearchTerm('');
                              setShowCodeList(false);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors"
                          >
                            <div className="font-medium text-sm">{code.code}</div>
                            <div className="text-xs text-gray-600">
                              {code.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Empieza a escribir para buscar diagnósticos
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedCode && (
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-900">
                {selectedCode.code} - {selectedCode.description}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Categoría: {selectedCode.category} 
                {selectedCode.isChronic && ' • Enfermedad Crónica'}
              </p>
            </div>
          )}

          {/* Severity and Onset */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Severidad *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SEVERITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="onsetType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Inicio *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ONSET_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Clinical Presentation */}
          <FormField
            control={form.control}
            name="clinicalPresentation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Presentación Clínica *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe los síntomas y hallazgos clínicos del paciente"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Mínimo 10 caracteres
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Relevant History */}
          <FormField
            control={form.control}
            name="relevantHistory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Antecedentes Relevantes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ej: Historial familiar, exposiciones ocupacionales, cirugías previas, etc."
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Physical Exam Findings */}
          <FormField
            control={form.control}
            name="physicalExamFindings"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hallazgos del Examen Físico</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe los hallazgos del examen físico relevantes"
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Primary Diagnosis */}
          <FormField
            control={form.control}
            name="primaryDiagnosis"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 rounded-lg bg-blue-50 p-4">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <FormLabel className="mb-0 text-sm font-normal">
                  Marcar como diagnóstico principal
                </FormLabel>
              </FormItem>
            )}
          />

          {/* Submit Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={submitLoading}
              className="flex-1"
            >
              {submitLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Registrando diagnóstico...
                </>
              ) : (
                'Registrar Diagnóstico'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              Limpiar
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
}

export default DiagnosisForm;
