import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import {
  User,
  Home,
  GraduationCap,
  Briefcase,
  FileText,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useNacionalidades } from "@/hooks/useNacionalidades";
import { useDistritosSanitarios } from "@/hooks/useDistritosSanitarios";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useCenterSync } from "@/hooks/useCenterSync";

// Importaciones de los componentes de paso (asumimos que existen en estas rutas)
import { PersonalInfoStep } from "@/components/registration/PersonalInfoStep";
import { AddressStep } from "@/components/registration/AddressStep";
import { EducationStep } from "@/components/registration/EducationStep";
import { WorkSituationStep } from "@/components/registration/WorkSituationStep";
import { DocumentsStep } from "@/components/registration/DocumentsStep";
import ConfirmationStep from "@/components/registration/ConfirmationStep";
import { RegistrationProgress } from "@/components/registration/RegistrationProgress";
import PDFSummary from "@/components/registration/PDFSummary";
import PoliticasModal from "@/components/registration/PoliticasModal";
import ProcedureModal from "@/components/registration/ProcedureModal";
import { ExitConfirmationDialog } from "@/components/registration/ExitConfirmationDialog";

// --- LÓGICA DE PERSISTENCIA ---
const STORAGE_KEY = "professional_registration_form_data";
const PENDING_SEND_KEY = "professional_registration_pending_send";

const normalizeNacionalidad = (v: any) => String(v || '').trim().toUpperCase();
const isNacionalidadEcuatoguineana = (v: any) => {
  const n = normalizeNacionalidad(v);
  return (
    n === 'ECUATOGUINEANA' ||
    n === 'ECUATORGUINEANA' ||
    n.replace(/\s+/g, ' ') === 'GUINEA ECUATORIAL' ||
    n.includes('ECUATO') ||
    n.includes('ECUATOR')
  );
};

const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  let t: any;
  const timeout = new Promise<never>((_, reject) => {
    t = setTimeout(() => reject(new Error(`Tiempo de espera agotado (${label})`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (t) clearTimeout(t);
  }
};

// Función para cargar datos persistentes desde localStorage
const getPersistedData = (): { currentStep: number; formData: Partial<FormData> } | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);

    // CRÍTICO: Limpiar campos de archivos (FileList/File)
    // No son serializables y deben ser re-seleccionados.
    if (parsed.formData) {
      // Campos que contienen FileList o File[]
      delete parsed.formData.foto_carnet;
      delete parsed.formData.documentos_adicionales;
    }

    // Asegurar que solo se devuelven los campos de tipo FormData si son válidos
    const validFormData = parsed.formData && typeof parsed.formData === 'object' ? parsed.formData : {};

    return {
      currentStep: typeof parsed.currentStep === 'number' ? parsed.currentStep : 1,
      formData: validFormData
    };

  } catch (e) {
    console.warn("Error cargando datos de localStorage:", e);
    return null;
  }
};

// --- FUNCIÓN CLAVE PARA CONVERSIÓN A BASE64 ---
const urlToBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error al descargar la imagen de la URL: ${response.statusText}`);
      return null;
    }
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string); // Esto es la cadena Base64 (data:image/...)
      };
      reader.onerror = () => {
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error en urlToBase64:", error);
    return null;
  }
};
// ---------------------------------------------


// Esquema de validación con Zod
const formSchema = z
  .object({
    nombre: z.string().min(2, "El nombre es requerido"),
    apellidos: z.string().min(2, "Los apellidos son requeridos"),
    genero: z.string().min(1, "El género es requerido"),
    fecha_nacimiento: z.string().min(1, "La fecha de nacimiento es requerida"),
    nacionalidad: z.string().min(1, "Seleccione su nacionalidad"),
    numero_dip: z.string().optional(),
    numero_pasaporte: z.string().optional(),
    numero_tarjeta_rfid: z
      .string()
      .optional()
      .refine((value) => !value || /^\d{1,10}$/.test(value), {
        message: "Ingrese hasta 10 dígitos",
      }),
    telefono: z.string().min(9, "El teléfono debe tener al menos 9 dígitos"),
    domicilio: z.string().min(2, "El domicilio es requerido"),
    provincia: z.string().min(1, "La provincia es requerida"),
    distrito: z.string().min(1, "El distrito es requerido"),
    area_profesional: z.string().min(1, "El área profesional es requerida"),
    especialidad: z.string().optional(),
    categoria_titulacion: z
      .string()
      .min(1, "La categoría de titulación es requerida"),
    titulacion_especifica_1: z.string().min(1, "La titulación es requerida"),
    institucion_1: z.string().min(1, "La institución es requerida"),
    categoria_institucion_1: z.string().optional(),
    institucion_formacion_id_1: z.string().optional(),
    periodo_formacion: z
      .string()
      .min(1, "El período de formación es requerido"),
    pais_formacion_1: z.string().min(1, "El país de formación es requerido"),
    situacion_laboral: z.string().min(1, "La situación laboral es requerida"),
    nombre_centro: z.string().min(1, "El centro de trabajo es requerido"),
    centro_salud_id: z.string().optional(), // ID del centro seleccionado
    categoria_centro: z.string().min(1, "La categoría del centro es requerida"),
    tipo_sector: z.string().min(1, "El tipo de sector es requerido"),
    distrito_sanitario: z.string().optional(),
    funcion_publica: z.boolean().default(false), // Nueva categorización
    funcionario_estatus: z.enum(['nombrado', 'no_nombrado']).optional(),
    numero_funcionario: z.string().optional(),
    fecha_nombramiento: z.string().optional(),
    fecha_inicio_trabajo: z.string().optional(),
    pertenece_brigada_medica: z.boolean().default(false),
    tipo_cooperacion: z.string().optional(),

    // Validaciones para foto_carnet (un solo archivo FileList)
    foto_carnet: z
      .any()
      .refine(
        (files: FileList | undefined) => files && files.length > 0,
        "La foto de carnet es obligatoria.",
      )
      .refine(
        (files: FileList | undefined) => files?.[0]?.size <= 2 * 1024 * 1024,
        `La foto debe ser menor de 2MB.`,
      )
      .refine(
        (files: FileList | undefined) =>
          files &&
          ["image/jpeg", "image/jpg", "image/png"].includes(files[0]?.type),
        "Formato de foto no válido (solo JPG/PNG).",
      ),

    // Campo 'documentos' renombrado a 'documentos_adicionales' y validaciones para File[]
    documentos_adicionales: z
      .any()
      .refine((files: File[] | undefined) => {
        if (!files || files.length === 0) return true; // Es opcional
        return files.every((file: File) => file.size <= 5 * 1024 * 1024);
      }, `Cada documento debe ser menor de 5MB.`)
      .refine((files: File[] | undefined) => {
        if (!files || files.length === 0) return true; // Es opcional
        return files.every((file: File) =>
          ["application/pdf", "image/jpeg", "image/jpg", "image/png"].includes(
            file.type,
          ),
        );
      }, "Formato de documento no válido (solo PDF, JPG, PNG).")
      .optional(),

    acepta_politicas: z
      .boolean()
      .refine((val) => val === true, "Debe aceptar las políticas"),
  })
  .superRefine(async (data, ctx) => {
    if (!data.nacionalidad || data.nacionalidad.trim() === "") {
      return;
    }

    const isEcuatoguineana = isNacionalidadEcuatoguineana(data.nacionalidad);

    if (isEcuatoguineana) {
      if (!data.numero_dip || data.numero_dip.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Verifique su número de DIP",
          path: ["numero_dip"],
        });
      } else {
        // Validar que DIP sea único en la base de datos
        try {
          const { data: existingDIP, error } = await supabase
            .from('profesionales_sanitarios')
            .select('id')
            .eq('numero_dip', data.numero_dip.trim())
            .maybeSingle();

          if (existingDIP && !error) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Este número de DIP ya está registrado en el sistema",
              path: ["numero_dip"],
            });
          }
        } catch (e) {
          console.warn("Error validando DIP único:", e);
        }
      }
    } else {
      if (!data.numero_pasaporte || data.numero_pasaporte.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Verifique su número de Pasaporte.",
          path: ["numero_pasaporte"],
        });
      } else {
        // Validar que Pasaporte sea único en la base de datos
        try {
          const { data: existingPassport, error } = await supabase
            .from('profesionales_sanitarios')
            .select('id')
            .eq('numero_pasaporte', data.numero_pasaporte.trim())
            .maybeSingle();

          if (existingPassport && !error) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Este número de Pasaporte ya está registrado en el sistema",
              path: ["numero_pasaporte"],
            });
          }
        } catch (e) {
          console.warn("Error validando Pasaporte único:", e);
        }
      }
    }

    // Validar unicidad del teléfono
    if (data.telefono && data.telefono.trim().length >= 9) {
      try {
        const telefonoNorm = data.telefono.replace(/\s|-/g, "").trim();
        const { data: existingTel, error } = await supabase
          .from('profesionales_sanitarios')
          .select('id')
          .eq('telefono', telefonoNorm)
          .maybeSingle();

        if (existingTel && !error) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Este número de teléfono ya está registrado en el sistema",
            path: ["telefono"],
          });
        }
      } catch (e) {
        console.warn("Error validando teléfono único:", e);
      }
    }

    if (data.funcion_publica) {
      if (!data.funcionario_estatus) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Seleccione el tipo de funcionario", path: ["funcionario_estatus"] });
      } else if (data.funcionario_estatus === 'nombrado') {
        if (!data.numero_funcionario || !data.numero_funcionario.trim()) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ingrese su número de funcionario", path: ["numero_funcionario"] });
        }
        if (!data.fecha_nombramiento) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Seleccione la fecha de nombramiento", path: ["fecha_nombramiento"] });
        }
      } else if (data.funcionario_estatus === 'no_nombrado') {
        if (!data.fecha_inicio_trabajo) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Seleccione la fecha de inicio de trabajo", path: ["fecha_inicio_trabajo"] });
        }
      }
    }
  });

type FormData = z.infer<typeof formSchema>;

// Definición de los pasos del formulario
const steps = [
  { id: 1, title: "Datos Personales", icon: User },
  { id: 2, title: "Domicilio", icon: Home },
  { id: 3, title: "Formación", icon: GraduationCap },
  { id: 4, title: "Situación Laboral", icon: Briefcase },
  { id: 5, title: "Documentos", icon: FileText },
  { id: 6, title: "Confirmación", icon: CheckCircle },
];

// Campos a validar por cada paso
const stepFields: { [key: number]: (keyof FormData)[] } = {
  1: [
    "nombre",
    "apellidos",
    "genero",
    "fecha_nacimiento",
    "nacionalidad",
    "numero_dip",
    "numero_pasaporte",
    "numero_tarjeta_rfid",
    "telefono",
  ],
  2: ["domicilio", "provincia", "distrito"],
  3: [
    "area_profesional",
    "categoria_titulacion",
    "titulacion_especifica_1",
    "institucion_1",
    "periodo_formacion",
    "pais_formacion_1",
    "especialidad",
  ],
  4: [
    "situacion_laboral",
    "nombre_centro",
    "categoria_centro",
    "tipo_sector",
    "distrito_sanitario",
    "tipo_cooperacion",
    "pertenece_brigada_medica",
  ],
  5: ["foto_carnet", "documentos_adicionales", "acepta_politicas"],
  6: [],
};

const ProfessionalRegistration = () => {
  // --- INICIALIZACIÓN DE PERSISTENCIA ---
  const persistedData = getPersistedData();
  const initialStep = persistedData?.currentStep || 1;
  const persistedFormData = persistedData?.formData || {};
  // ---------------------------------------

  // --- ESTADOS ORIGINALES ---
  const [currentStep, setCurrentStep] = useState(initialStep); // <-- MODIFICADO
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [fotoCarnetBase64, setFotoCarnetBase64] = useState<string | null>(null);
  const [formDataForPDF, setFormDataForPDF] = useState<any>(null);
  const [showPoliticasModal, setShowPoliticasModal] = React.useState(false);
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string>("");
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  // --------------------------

  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: nacionalidades = [] } = useNacionalidades();
  const { data: distritosSanitarios = [] } = useDistritosSanitarios();
  const { uploadFile, uploadPDF, isUploading } = useFileUpload();
  const { syncCenterFromProfessional, updateProfessionalCenterMutation } =
    useCenterSync();

  console.log(
    "Distritos sanitarios en ProfessionalRegistration:",
    distritosSanitarios,
  );

  // Inicialización del formulario con react-hook-form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pertenece_brigada_medica: false,
      acepta_politicas: false,
      situacion_laboral: "Activo",
      nacionalidad: "Ecuatoguineana",
      telefono: "+240",
      numero_tarjeta_rfid: "",
      funcionario_estatus: undefined,
      numero_funcionario: "",
      fecha_nombramiento: "",
      fecha_inicio_trabajo: "",
      meses_en_paro: undefined as any,
      ultimo_trabajo: "",
      recien_graduado: false,
      categoria_institucion_1: "",
      institucion_formacion_id_1: "",
      // CRÍTICO: Sobrescribe los valores por defecto con los datos guardados
      ...persistedFormData,
    },
  });

  const watchedValues = form.watch(); // Observa todos los valores del formulario

  // --- EFECTO DE PERSISTENCIA (AÑADIDO) ---
  useEffect(() => {
    // Si la solicitud ya fue enviada (limpiada), no guardar
    if (solicitudEnviada) return;

    const formDataToPersist: Partial<FormData> = form.getValues();

    // CRÍTICO: Excluir FileList/File antes de serializar
    delete formDataToPersist.foto_carnet;
    delete formDataToPersist.documentos_adicionales;

    // Guardar el estado completo (paso actual y datos de texto)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentStep,
      formData: formDataToPersist,
    }));

    // console.log(`[Persistencia] Datos guardados. Paso: ${currentStep}`);
  }, [watchedValues, currentStep, form, solicitudEnviada]);

  // EFECTO PARA LIMPIAR LOCALSTORAGE DESPUÉS DEL ENVÍO EXITOSO
  useEffect(() => {
    if (solicitudEnviada) {
      console.log('[Limpieza] Solicitud enviada exitosamente, limpiando localStorage...');
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [solicitudEnviada]);
  // ----------------------------------------


  // Manejador para la carga de documentos adicionales
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
    // Sincroniza con react-hook-form
    form.setValue("documentos_adicionales", [
      ...(form.getValues("documentos_adicionales") || []),
      ...files,
    ]);
  };

  // Manejador para eliminar un documento adicional
  const removeFile = (index: number) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
    // Sincroniza con react-hook-form
    form.setValue("documentos_adicionales", updatedFiles);
  };

  // Manejador para la carga de la foto de carnet
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPhotoFile(null);
      setFotoCarnetBase64(null);
      form.setValue("foto_carnet", undefined); // Sincroniza con react-hook-form
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFotoCarnetBase64(base64);
    };
    reader.readAsDataURL(file);
    form.setValue("foto_carnet", [file]); // Sincroniza con react-hook-form (FileList)
  };

  // Manejador para eliminar la foto de carnet
  const removePhoto = () => {
    setPhotoFile(null);
    setFotoCarnetBase64(null);
    form.setValue("foto_carnet", undefined); // Sincroniza con react-hook-form
  };

  // Normalización de número de teléfono a formato E.164 para Guinea Ecuatorial
  const normalizeTelefono = (tel: string): string => {
    if (!tel) return "";
    let v = tel.replace(/\s|-/g, "");
    if (v.startsWith("+240")) return v;
    if (v.startsWith("00240")) return "+" + v.slice(2);
    if (v.startsWith("240")) return "+" + v;
    if (v.startsWith("+")) return v;
    v = v.replace(/^0+/, "");
    return "+240" + v;
  };

  // Función principal de envío del formulario
  const onSubmit = async (data: FormData) => {
    console.log("onSubmit llamado con datos:", data);

    if (solicitudEnviada) {
      toast({
        title: "Solicitud ya enviada",
        description:
          "Esta solicitud ya ha sido enviada. No puede enviar duplicados.",
        variant: "destructive",
      });
      return;
    }

    if (!photoFile) {
      setErrorEnvio(
        "La foto tipo carnet es obligatoria para enviar la solicitud.",
      );
      toast({
        title: "Requisito Faltante",
        description:
          "Por favor, suba su foto tipo carnet para enviar la solicitud.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    setErrorEnvio("");

    try {
      console.log("Iniciando proceso de envío de formulario...");

      // Marcador de “envío en progreso” para recuperación UI (evita quedar colgado sin feedback)
      try {
        localStorage.setItem(PENDING_SEND_KEY, JSON.stringify({ at: new Date().toISOString() }));
      } catch {}

      // Subir foto directamente a Supabase Storage (sin hook que puede fallar)
      let fotoUrl: string | null = null;
      try {
        const fileExt = photoFile!.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('fotos-carnet')
          .upload(fileName, photoFile!, { cacheControl: '3600', upsert: false });
        
        if (uploadError) {
          console.error("Error subiendo foto:", uploadError);
          throw new Error(`Error al subir la foto: ${uploadError.message}`);
        }
        
        const { data: { publicUrl } } = supabase.storage.from('fotos-carnet').getPublicUrl(fileName);
        fotoUrl = publicUrl;
        console.log("Foto subida exitosamente:", fotoUrl);
      } catch (uploadErr: any) {
        console.error("Error en subida de foto:", uploadErr);
        throw new Error(`Error al subir la foto: ${uploadErr.message || 'Error desconocido'}`);
      }

      if (!fotoUrl) {
        throw new Error("No se pudo obtener la URL de la foto");
      }

      // Asegurar relación con institución de formación
      let institucionFormacionId: string | null = null;
      if (data.institucion_1 && data.pais_formacion_1) {
        const { data: existing, error: findErr } = await supabase
          .from('instituciones_formacion')
          .select('id, categoria')
          .eq('nombre', data.institucion_1.trim())
          .eq('pais', data.pais_formacion_1.trim())
          .maybeSingle();
        if (findErr) console.warn('find institucion error', findErr);
        if (existing?.id) {
          institucionFormacionId = existing.id;
        } else {
          const { data: created, error: createErr } = await supabase
            .from('instituciones_formacion')
            .insert([{ nombre: data.institucion_1.trim(), pais: data.pais_formacion_1.trim(), categoria: (data as any).categoria_institucion_1 || 'OTRA' }])
            .select('id')
            .single();
          if (!createErr) institucionFormacionId = created?.id || null;
        }
      }

      // Calcular edad
      const birthDate = new Date(data.fecha_nacimiento);
      const age = new Date().getFullYear() - birthDate.getFullYear();

      // Preparar lista de documentos (se suben después de crear el profesional con su ID real)
      let documentosUrls: string[] = [];

      // Helper para uppercasing seguro
      const U = (v: any) => (typeof v === 'string' ? v.toUpperCase() : v);
      const toGenero = (g: any) => {
        const s = String(g || '').trim().toLowerCase();
        if (!s) return null;
        if (s.startsWith('m')) return 'Masculino';
        if (s.startsWith('f')) return 'Femenino';
        return s.charAt(0).toUpperCase() + s.slice(1);
      };

      // Crear objeto con los datos del formulario (texto en MAYÚSCULAS, excepto distrito_sanitario)
      const submissionData = {
        nombre_completo: `${U(data.nombre)} ${U(data.apellidos)}`,
        nombre: U(data.nombre),
        apellidos: U(data.apellidos),
        genero: toGenero(data.genero),
        fecha_nacimiento: data.fecha_nacimiento,
        edad: age,
        nacionalidad: U(data.nacionalidad),
        numero_dip: data.numero_dip || null,
        numero_pasaporte: data.numero_pasaporte || null,
        numero_tarjeta_rfid: data.numero_tarjeta_rfid ? data.numero_tarjeta_rfid : null,
        telefono: normalizeTelefono(data.telefono),
        domicilio: U(data.domicilio),
        provincia: U(data.provincia),
        distrito: U(data.distrito),
        area_profesional: data.area_profesional,
        especialidad: data.especialidad ? U(data.especialidad) : null,
        categoria_titulacion: U(data.categoria_titulacion),
        titulacion_especifica_1: U(data.titulacion_especifica_1),
        institucion_1: U(data.institucion_1),
        periodo_formacion: U(data.periodo_formacion),
        pais_formacion_1: U(data.pais_formacion_1),
        pais_formacion_id_1: data.pais_formacion_id_1,
        situacion_laboral: U(data.situacion_laboral),
        meses_en_paro: data.situacion_laboral === 'En paro' ? Number(data.meses_en_paro ?? 0) : null,
        ultimo_trabajo: data.situacion_laboral === 'En paro' ? (data.ultimo_trabajo || null) : null,
        recien_graduado: data.situacion_laboral === 'En paro' ? !!data.recien_graduado : false,
        nombre_centro: data.nombre_centro ? U(data.nombre_centro) : null,
        centro_salud_id: data.centro_salud_id || null, // ID del centro
        categoria_centro: data.categoria_centro ? U(data.categoria_centro) : null,
        tipo_sector: data.tipo_sector || null,
        distrito_sanitario: data.distrito_sanitario || null, // se mantiene desde catálogo
        funcion_publica: data.funcion_publica || false,
        estatus_funcionario: data.funcion_publica ? (data.funcionario_estatus || null) : null,
        numero_funcionario: data.funcion_publica && data.funcionario_estatus === 'nombrado' ? (data.numero_funcionario || null) : null,
        fecha_nombramiento: data.funcion_publica && data.funcionario_estatus === 'nombrado' ? (data.fecha_nombramiento || null) : null,
        fecha_inicio_trabajo: data.funcion_publica && data.funcionario_estatus === 'no_nombrado' ? (data.fecha_inicio_trabajo || null) : null,
        pertenece_brigada_medica: data.pertenece_brigada_medica,
        tipo_cooperacion: data.tipo_cooperacion ? U(data.tipo_cooperacion) : null,
        // Nuevos campos: tipo de profesional y experiencia laboral
        tipo_profesional: (data as any).tipo_profesional || 'sanitario',
        experiencia_laboral: (data as any).experiencia_laboral || [],
        // URLs de documentos adicionales subidos al bucket
        documentos_adicionales: documentosUrls,
        foto_carnet: fotoUrl,
        institucion_formacion_id_1: data.institucion_formacion_id_1 || null,
        estado_solicitud: "Recibido" as const,
        fecha_solicitud: new Date().toISOString().split("T")[0],
      };

      console.log("Datos a enviar a Supabase:", submissionData);

      // ✅ VERIFICACIÓN DE IDEMPOTENCIA: Detectar si ya existe este profesional
      const telefonoNorm = normalizeTelefono(data.telefono);
      const dip = (data.numero_dip || '').trim();
      const pas = (data.numero_pasaporte || '').trim();

      let existingProfessional = null;
      try {
        let q = supabase
          .from('profesionales_sanitarios')
          .select('id, codigo_expediente, url_codigo_barras_expediente')
          .eq('telefono', telefonoNorm)
          .order('created_at', { ascending: false })
          .limit(1);

        if (dip) q = q.eq('numero_dip', dip);
        if (pas) q = q.eq('numero_pasaporte', pas);

        const { data: existing } = await q.maybeSingle();
        if (existing?.id) {
          existingProfessional = existing;
          console.log('✅ Se detectó que este profesional ya existe:', existing);
        }
      } catch (e) {
        console.warn('Error en verificación de idempotencia:', e);
      }

      let result;
      let error;

      if (existingProfessional) {
        // Ya existe, usar los datos existentes
        result = existingProfessional;
        console.log('📌 Usando registro existente:', result);
      } else {
        // No existe, insertar nuevo
        const insertPromise = supabase
          .from("profesionales_sanitarios")
          .insert([submissionData])
          .select("id, codigo_expediente, url_codigo_barras_expediente")
          .single();

        const insertResult = await withTimeout(insertPromise, 25_000, 'inserción en base de datos');
        result = insertResult.data;
        error = insertResult.error;

        if (error) {
          console.error("Error de Supabase:", error);
          throw new Error(`Error de base de datos: ${error.message}`);
        }
        console.log('✅ Nuevo registro insertado:', result);
      }

      // CRÍTICO: Limpiar datos persistidos después del éxito
      localStorage.removeItem(STORAGE_KEY);
      // ----------------------------------------------------

      console.log("Resultado exitoso de Supabase:", result);

      // Fallback: generar URL de código de barras del expediente si no vino del trigger
      let urlCodigoBarrasExp = result.url_codigo_barras_expediente;
      if (!urlCodigoBarrasExp && result.codigo_expediente) {
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('generar_url_codigo_barras_expediente', {
            codigo_expediente_param: result.codigo_expediente,
            categoria_titulacion_param: submissionData.categoria_titulacion
          });
          if (rpcError) throw rpcError;
          if (rpcData && typeof rpcData === 'string') {
            urlCodigoBarrasExp = rpcData;
            await supabase
              .from('profesionales_sanitarios')
              .update({ url_codigo_barras_expediente: rpcData })
              .eq('id', result.id);
          }
        } catch (e) {
          console.warn('No se pudo generar URL de código de barras via RPC:', e);
        }
      }

      // ⭐ PASO CLAVE 1: Obtener el código de barras en Base64 (con generador local como fallback)
      let codigoBarrasBase64: string | null = null;
      if (urlCodigoBarrasExp) {
        codigoBarrasBase64 = await withTimeout(urlToBase64(urlCodigoBarrasExp), 12_000, 'descarga código de barras');
      }
      if (!codigoBarrasBase64 && result.codigo_expediente) {
        try {
          const canvas = document.createElement('canvas');
          JsBarcode(canvas, String(result.codigo_expediente), { format: 'CODE128', displayValue: false, height: 40, width: 1.5 });
          codigoBarrasBase64 = canvas.toDataURL('image/png');
        } catch (e) {
          console.warn('No se pudo generar código de barras localmente:', e);
        }
      }

      // ---------------------------------------------------------------------
      // ⭐ PASO CLAVE 2: Subida de documentos adicionales (Directo a Storage)
      // ---------------------------------------------------------------------
      if (uploadedFiles.length > 0 && result?.id) {
        let uploadSucceeded = false;
        const professionalId = result.id;

        // Subida directa a Supabase Storage
        console.log("Subiendo documentos directamente a Storage...");
        try {
          const uploaded: string[] = [];
          for (const file of uploadedFiles) {
            const fileName = `${Date.now()}_${file.name}`;
            const filePath = `documentos-adicionales/${professionalId}/${fileName}`;

            const uploadPromise = supabase.storage
              .from('documentos-profesionales')
              .upload(filePath, file, { cacheControl: '3600', upsert: false, contentType: file.type });

            const { data: up, error: upErr } = await withTimeout(uploadPromise as any, 25_000, `subida documento: ${file.name}`);
            if (upErr) throw upErr;

            const { data: pub } = supabase.storage
              .from('documentos-profesionales')
              .getPublicUrl(up.path);
            uploaded.push(pub.publicUrl);
          }

          if (uploaded.length > 0) {
            const { data: current } = await supabase
              .from('profesionales_sanitarios')
              .select('documentos_adicionales')
              .eq('id', professionalId)
              .single();

            const combined = [...(current?.documentos_adicionales || []), ...uploaded];

            const { error: updErr } = await supabase
              .from('profesionales_sanitarios')
              .update({ documentos_adicionales: combined })
              .eq('id', professionalId);

            if (updErr) throw updErr;
            documentosUrls = combined;
            uploadSucceeded = true;
            console.log("Documentos subidos con éxito.");
          }
        } catch (e: any) {
          console.error("Error subiendo documentos:", e);
          toast({
            title: "Aviso",
            description: "El registro fue exitoso, pero los documentos adicionales no se pudieron subir.",
            variant: "default",
          });
        }

      }

      // Sync center data if professional is active
      if (data.situacion_laboral === "Activo" && data.nombre_centro) {
        try {
          const centerId = await withTimeout(
            syncCenterFromProfessional({
            nombre_centro: data.nombre_centro,
            categoria_centro: data.categoria_centro,
            distrito_sanitario: data.distrito_sanitario,
            tipo_sector: data.tipo_sector,
            provincia: data.provincia,
            distrito: data.distrito,
            professional_id: result.id,
            }),
            15_000,
            'sincronización de centro'
          );

          // Update professional with center ID if center was found/created
          if (centerId) {
            await updateProfessionalCenterMutation.mutateAsync({
              professionalId: result.id,
              centerId: centerId,
            });
            console.log("Professional linked to center:", centerId);
          }
        } catch (centerError) {
          console.error("Error syncing center data:", centerError);
          // Don't fail the registration if center sync fails
          toast({
            title: "Aviso",
            description:
              "El registro fue exitoso, pero hubo un problema al sincronizar los datos del centro.",
            variant: "default",
          });
        }
      }

      // Marcar solicitud como enviada
      setSolicitudEnviada(true);
      try { localStorage.removeItem(PENDING_SEND_KEY); } catch {}

      // Actualizar el estado interno con los datos para el PDF
      setFormDataForPDF({
        ...data,
        photoFile,
        foto_carnet: fotoUrl,
        foto_carnet_base64: fotoCarnetBase64,
        url_codigo_barras_expediente: urlCodigoBarrasExp || result.url_codigo_barras_expediente || '',
        codigo_barras_base64: codigoBarrasBase64, // ⭐ ESTA ES LA PROPIEDAD CLAVE
        codigo_expediente: result.codigo_expediente,
        edad: age,
        submittedData: result,
      });

      toast({
        title: "¡Solicitud enviada exitosamente!",
        description: `Su solicitud ha sido registrada con código: ${result.codigo_expediente}`,
      });
      setShowProcedureModal(true);

      setCurrentStep(6); // Ir al step de confirmación
    } catch (error: any) {
      console.error("Error completo al enviar formulario:", error);

      // Si se quedó colgado por timeout, intenta “reconciliar” verificando si la fila ya se creó
      const msg = String(error?.message || '');
      if (msg.toLowerCase().includes('tiempo de espera')) {
        try {
          const telefonoNorm = normalizeTelefono(data.telefono);
          const dip = (data.numero_dip || '').trim();
          const pas = (data.numero_pasaporte || '').trim();
          let q = supabase
            .from('profesionales_sanitarios')
            .select('id, codigo_expediente, url_codigo_barras_expediente')
            .eq('telefono', telefonoNorm)
            .order('created_at', { ascending: false })
            .limit(1);
          if (dip) q = q.eq('numero_dip', dip);
          if (pas) q = q.eq('numero_pasaporte', pas);
          const { data: maybe, error: e2 } = await q.maybeSingle();
          if (!e2 && maybe?.id) {
            setSolicitudEnviada(true);
            setFormDataForPDF({
              ...data,
              photoFile,
              foto_carnet: null,
              foto_carnet_base64: fotoCarnetBase64,
              url_codigo_barras_expediente: maybe.url_codigo_barras_expediente || '',
              codigo_expediente: maybe.codigo_expediente,
              edad: new Date().getFullYear() - new Date(data.fecha_nacimiento).getFullYear(),
              submittedData: maybe,
            });
            toast({
              title: 'Solicitud registrada',
              description: `Detectamos que la solicitud se registró. Código: ${maybe.codigo_expediente}`,
            });
            setCurrentStep(6);
            try { localStorage.removeItem(PENDING_SEND_KEY); } catch {}
            return;
          }
        } catch {}
      }

      const errorMessage =
        error.message || "Error desconocido al procesar la solicitud";
      setErrorEnvio(errorMessage);

      toast({
        title: "Error al enviar solicitud",
        description: errorMessage,
        variant: "destructive",
      });

      setCurrentStep(6); // Ir al step de confirmación para mostrar el error
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = stepFields[currentStep];

    // Si no hay campos definidos para el paso actual, simplemente avanza
    if (!fieldsToValidate || fieldsToValidate.length === 0) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
      return;
    }

    // Valida solo los campos del paso actual
    const isValid = await form.trigger(fieldsToValidate as any);

    if (isValid) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      toast({
        title: "Campos incompletos o incorrectos",
        description:
          "Por favor, complete correctamente todos los campos obligatorios del paso actual antes de avanzar.",
        variant: "destructive",
      });
      console.error(
        "Errores de validación al avanzar de paso:",
        JSON.stringify(form.formState.errors, null, 2),
      );
    }
  };

  const prevStep = () => {
    if (currentStep === 1) {
      // En el primer paso, mostrar diálogo de confirmación de salida
      setShowExitConfirmation(true);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleExitCancel = () => {
    setShowExitConfirmation(false);
  };

  const handleExitWithoutSave = () => {
    setShowExitConfirmation(false);
    localStorage.removeItem(STORAGE_KEY);
    navigate("/");
  };

  const handleExitWithSave = () => {
    setShowExitConfirmation(false);
    // Los datos ya están guardados en localStorage por el useEffect de persistencia
    toast({
      title: "Progreso guardado",
      description: "Tu progreso ha sido guardado. Puedes volver a continuar cuando desees.",
    });
    navigate("/");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInfoStep
            form={form}
            nacionalidades={nacionalidades}
            watchedValues={watchedValues}
          />
        );
      case 2:
        return <AddressStep form={form} watchedValues={watchedValues} />;
      case 3:
        return <EducationStep form={form} />;
      case 4:
        return (
          <WorkSituationStep
            form={form}
            watchedValues={watchedValues}
            distritosSanitarios={distritosSanitarios}
          />
        );
      case 5:
        return (
          <DocumentsStep
            uploadedFiles={uploadedFiles}
            handleFileUpload={handleFileUpload}
            removeFile={removeFile}
            photoFile={photoFile}
            handlePhotoUpload={handlePhotoUpload}
            removePhoto={removePhoto}
            setFotoCarnetBase64={setFotoCarnetBase64}
            setShowPoliticasModal={setShowPoliticasModal}
          />
        );
      case 6:
        return (
          <ConfirmationStep
            formData={
              formDataForPDF || {
                ...watchedValues,
                foto_carnet_base64: fotoCarnetBase64,
              }
            }
            isSubmitting={isSubmitting}
            solicitudEnviada={solicitudEnviada}
            errorEnvio={errorEnvio}
            onRetrySend={() => {
              // reintenta el submit con la data actual del form
              form.handleSubmit(onSubmit)();
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Registro de Profesional Sanitario
          </h1>
          <p className="text-center text-gray-600">
            Complete todos los campos para registrarse en el sistema
          </p>
        </div>

        <RegistrationProgress steps={steps} currentStep={currentStep} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {React.createElement(steps[currentStep - 1].icon, {
                    className: "w-5 h-5 text-blue-600",
                  })}
                  <span>{steps[currentStep - 1].title}</span>
                </CardTitle>
                <CardDescription>
                  Complete la información solicitada para continuar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderStepContent()}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
              >
                Anterior
              </Button>

              {currentStep < steps.length ? (
                <Button type="button" onClick={nextStep}>
                  Siguiente
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting || solicitudEnviada}
                  className="bg-guinea-teal hover:bg-guinea-teal/90"
                >
                  {isSubmitting
                    ? "Enviando..."
                    : solicitudEnviada
                      ? "Solicitud Enviada"
                      : "Enviar Solicitud"}
                </Button>
              )}
            </div>
          </form>
        </Form>

        <PoliticasModal
          open={showPoliticasModal}
          onClose={() => setShowPoliticasModal(false)}
        />
        <ProcedureModal
          isOpen={showProcedureModal}
          onClose={() => setShowProcedureModal(false)}
        />
        <ExitConfirmationDialog
          isOpen={showExitConfirmation}
          onCancel={handleExitCancel}
          onExit={handleExitWithoutSave}
          onSave={handleExitWithSave}
        />
      </div>
    </div>
  );
};

export default ProfessionalRegistration;
