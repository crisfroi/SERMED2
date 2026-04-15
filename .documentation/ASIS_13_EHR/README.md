# ASIS_13: Electronic Health Record (EHR)

**Status**: ✅ MIGRACIONES APLICADAS (15 Abril 2026)

## 📊 Tablas Creadas

| Tabla | Filas | Propósito |
|-------|-------|----------|
| `electronic_health_record` | 0 | Historia médica del paciente |
| `ehr_episode_links` | 0 | Episodios clínicos vinculados |
| `ehr_document_storage` | 0 | Almacenamiento de documentos médicos |

## 🔗 Relaciones

```
electronic_health_record (PK: id)
├── ehr_episode_links (FK: ehr_id) 
├── ehr_document_storage (FK: ehr_id)
    └── ehr_episode_links (FK: episode_id, optional)
```

## 🔐 RLS Policies

- **electronic_health_record**: Acceso por `hospital_id`
- **ehr_episode_links**: Herencia de acceso desde EHR
- **ehr_document_storage**: Herencia de acceso desde EHR

## 📝 Índices

- `patient_id`: Búsquedas por paciente
- `hospital_id`: Fitraje por hospital
- `episode_type`: Fitraje por tipo de episodio
- `document_type`: Fitraje por tipo de documento
- `content_fts`: Full-text search en español

## 🚀 Próximos Pasos

1. Crear hooks React: `useEHR()`, `useEHRDocuments()`
2. Crear edge functions: sync THALAMUS, document upload
3. Actualizar ASIS_13 components para usar tablas
4. Testing & deployment
