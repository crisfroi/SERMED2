# 🏥 WEEK 12: ADMIN 2 - SALAS DE ESPERA (WAITING ROOMS)
## Gestión Integral de Colas y Experiencia del Paciente

**Objetivo**: 5 Hitos = 8,500 líneas  
**Patrón Estándar**: SQL → React → Hooks → Functions → Tests  
**Entregables**: Sistema completo de gestión de salas de espera con notificaciones en tiempo real

---

## 📋 Resumen Ejecutivo

### ¿Por qué Salas de Espera?

Una sala de espera mal gestionada causa:
- ❌ Confusión sobre orden de atención
- ❌ Pacientes perdidos/no llamados
- ❌ Caos en urgencias (sin priorización)
- ❌ Sin visibilidad para administración

**Solución**: Sistema digital que:
- ✅ Muestra cola en tiempo real (pantalla en sala)
- ✅ Notifica a pacientes por SMS/llamada
- ✅ Integra con consultorios (cuando disponible)
- ✅ Priorización automática (urgencia)
- ✅ Analytics de tiempos de espera

---

## 🎯 HITO 1: SQL MIGRATIONS (1,200 líneas)

### Tablas Principales

```sql
-- TABLA: waiting_rooms (Salas de espera)
CREATE TABLE waiting_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL FK hospitals,
  room_name VARCHAR(100) NOT NULL,        -- "Sala de Urgencias", "Consultorios General"
  room_type VARCHAR(50) NOT NULL,         -- emergency, consultation, examination, lab, imaging
  max_capacity INT DEFAULT 50,
  current_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- TABLA: waiting_queue (Cola de pacientes)
CREATE TABLE waiting_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL FK waiting_rooms,
  patient_id UUID NOT NULL FK patients,
  consultation_type VARCHAR(100),         -- "Consulta General", "Inyección", "Toma de muestra"
  priority_level VARCHAR(20) DEFAULT 'normal',  -- low, normal, high, critical, emergency
  
  queued_at TIMESTAMP DEFAULT now(),
  called_at TIMESTAMP,                    -- Cuándo se llamó
  attended_at TIMESTAMP,                  -- Cuándo se atendió
  completed_at TIMESTAMP,                 -- Cuándo terminó
  
  clinic_id UUID FK clinics,              -- Consultorio asignado
  clinician_id UUID FK users,             -- Quién atiende
  
  no_show BOOLEAN DEFAULT FALSE,          -- No se presentó
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- TABLA: queue_notifications (Notificaciones enviadas)
CREATE TABLE queue_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_entry_id UUID NOT NULL FK waiting_queue,
  notification_type VARCHAR(50),          -- sms, email, push, call
  status VARCHAR(20),                     -- pending, sent, failed
  destination VARCHAR(200),               -- Número de teléfono, email, etc.
  sent_at TIMESTAMP,
  delivery_confirmation BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT now()
);

-- TABLA: queue_analysis (Estadísticas y análisis)
CREATE TABLE queue_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL FK waiting_rooms,
  analysis_date DATE,
  
  total_patients_queued INT,
  avg_wait_time_minutes INT,
  max_wait_time_minutes INT,
  min_wait_time_minutes INT,
  
  priority_breakdown JSONB,               -- {"critical": 2, "high": 5, "normal": 20}
  no_show_count INT,
  
  created_at TIMESTAMP DEFAULT now()
);

-- TABLA: queue_audit_log (Auditoría - HIPAA)
CREATE TABLE queue_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_entry_id UUID NOT NULL FK waiting_queue,
  action VARCHAR(100),                    -- queued, called, attended, no_show, escalated
  performed_by UUID FK users,
  ip_address VARCHAR(50),
  timestamp TIMESTAMP DEFAULT now(),
  notes TEXT
);
```

### Índices de Rendimiento (10+ índices)

```sql
-- Performance Indexes
CREATE INDEX idx_queue_room_active ON waiting_queue(room_id, called_at) WHERE called_at IS NULL;
CREATE INDEX idx_queue_priority ON waiting_queue(room_id, priority_level) WHERE attended_at IS NULL;
CREATE INDEX idx_queue_patient ON waiting_queue(patient_id, queued_at);
CREATE INDEX idx_queue_clinic ON waiting_queue(clinic_id) WHERE attended_at IS NULL;
CREATE INDEX idx_queue_time_range ON waiting_queue(queued_at, completed_at);
CREATE INDEX idx_analysis_date ON queue_analysis(analysis_date);
CREATE INDEX idx_notifications_status ON queue_notifications(status);
CREATE INDEX idx_audit_timestamp ON queue_audit_log(timestamp);
-- ... más índices
```

### RLS Policies (4 políticas)

```sql
-- Patient: solo ver su propia entrada en cola
-- Clinician: ver pacientes en su consultorio
-- Nurse: ver toda la sala completa
-- Admin: acceso completo
```

### Triggers (4 automaciones)

```sql
-- trigger_calculate_wait_time: Auto-calcular tiempo de espera
-- trigger_auto_escalate_priority: Escalar prioridad si espera > 30 min
-- trigger_send_notification_on_call: Enviar notificación cuando se llama
-- trigger_log_queue_action: Log de todas las acciones
```

### Functions (4 PL/pgSQL)

```sql
-- calculate_queue_position(queue_entry_id) -> INT
-- get_next_patient(room_id) -> UUID
-- update_queue_analytics(room_id, date)
-- send_notification_batch(room_id)
```

---

## 🎨 HITO 2: REACT COMPONENTS (2,200 líneas)

### 1. WaitingRoomDashboard.tsx (700 líneas)
**Propósito**: Vista principal de la sala de espera (pantalla física en sala)

**Componentes**:
```typescript
├─ Header
│  ├─ Nombre de sala: "URGENCIAS - Planta 2"
│  ├─ Hora actual
│  └─ Status badge (Abierto/Cerrado)
│
├─ MainQueue (Cola visual - GRANDE)
│  ├─ Cola actual (20-30 personas visible)
│  │  ├─ Ticket #: BOX-0051
│  │  ├─ Nombre: JUAN GARCÍA
│  │  ├─ Prioridad: 🔴 CRITICAL (rojo)
│  │  └─ Tiempo espera: 45 min
│  ├─ Scroll automático cada 5 seg
│  └─ Colores por prioridad:
│     ├─ 🟢 Low (verde)
│     ├─ 🟡 Normal (amarillo)
│     ├─ 🟠 High (naranja)
│     └─ 🔴 Critical (rojo)
│
├─ CurrentlyBeingAttended
│  ├─ Consultorio: "Sala 3 - Dra. Elena"
│  ├─ Paciente actual: JUAN GARCÍA
│  └─ Duración: 12 min
│
├─ Analytics (3 KPIs pequeños)
│  ├─ Promedio espera: 18 min
│  ├─ En cola: 47 pacientes
│  └─ No-shows hoy: 3
│
└─ AudioAnnouncement(optional)
   └─ "SIGUIENTE TICKET... BOX-0052... SALA 4"
      (Audio a través de speaker del hospital)
```

**Features**:
- Pantalla fullscreen optimizada (TV 55")
- Auto-refresh cada 3 segundos
- Tema claro (text grande para visibility)
- Responsive (funciona en tablets también)

---

### 2. QueueManagementPanel.tsx (650 líneas)
**Propósito**: Panel de control para enfermeras/admins

**Componentes**:
```typescript
├─ ControlBar (Top)
│  ├─ Botón: "Llamar Siguiente" (grande, rojo)
│  ├─ Botón: "Marcar No-Show"
│  ├─ Botón: "Reagendar"
│  └─ Urgencias toggle
│
├─ QueueList (Centro - Scroll tabla)
│  ├─ ID | Paciente | Prioridad | Espera | Acciones
│  ├─ Rows con detalles expandibles
│  └─ Búsqueda por nombre/ID
│
├─ QueueFilters (Sidebar)
│  ├─ Filtrar por prioridad
│  ├─ Mostrar solo espera > X min
│  ├─ Ver histórico hoy
│
└─ NotificationCenter
   ├─ SMS enviados (count)
   ├─ Llamadas hechas (count)
   └─ Fallos de notificación (alertas)
```

**Features**:
- Interfaz rápida (clic mínimo para llamar siguiente)
- Sonido al llamar (opcional)
- Integración con SMS/llamadas
- Descarga de reportes

---

### 3. PatientWaitingScreen.tsx (400 líneas)
**Propósito**: Lo que ve el paciente en su teléfono/tablet

**Componentes**:
```typescript
├─ Header
│  ├─ Ticket: BOX-0051 (número GRANDE)
│  └─ Hospital: "Hospital Central"
│
├─ Status
│  ├─ "Estás en posición #5 en la cola"
│  ├─ "Tiempo estimado: 22 minutos"
│  ├─ Progress bar (visual del progreso)
│
├─ Notifications
│  ├─ "Te llamaremos cuando sea tu turno"
│  ├─ Opción para SMS optional
│  └─ Opción para push notifications
│
├─ AdditionalInfo
│  ├─ Hospital dirección/teléfono
│  ├─ Baños ubicación
│  ├─ Cafetería/vending
│  └─ WiFi gratuito: password
│
└─ SOS Button
   └─ "Alertar enfermera" (si emergencia)
```

**Features**:
- Responsive mobile-first
- Auto-refresh posición cada 10s
- Notificación cuando se acerca
- Dark mode (por defecto)

---

### 4. QueueAnalyticsReport.tsx (250 líneas)
**Propósito**: Reportes y análisis para gerencia

**Contenido**:
```typescript
├─ Period Selector
│  ├─ Today / This Week / This Month
│  └─ Custom date range
│
├─ KPIs Cards
│  ├─ Promedio tiempo espera
│  ├─ Máximo tiempo observado
│  ├─ Total pacientes atendidos
│  ├─ No-show rate %
│
├─ Charts
│  ├─ Tiempo espera por hora (line chart)
│  ├─ Distribución prioridades (pie)
│  ├─ Cola por sala (bar chart)
│  ├─ Tendencia no-shows (trend)
│
└─ Export Options
   ├─ PDF
   ├─ Excel
   └─ Share
```

---

### 5. RoomConfigurationPage.tsx (200 líneas)
**Propósito**: Admin configura salas

**Features**:
- Crear/editar salas
- Nombre, tipo, capacidad máxima
- Asignación de consultorios
- Activar/desactivar salas

---

## 🪝 HITO 3: CUSTOM HOOKS (1,800 líneas)

### 1. useWaitingQueue.ts (500 líneas)
**Propósito**: Gestión completa de la cola

```typescript
interface QueueEntry {
  id, patient_id, room_id, priority_level, queued_at, called_at, attended_at
}

export interface UseWaitingQueueReturn {
  // Queries
  queueList: QueueEntry[]
  queueLoading: boolean
  queuePosition: (patientId) => number  // Posición en la cola
  estimatedWaitTime: (patientId) => number  // Minutos
  nextPatient: () => QueueEntry
  
  // Mutations
  addToQueue: (patientId, type, priority) => Promise<QueueEntry>
  callNextPatient: () => Promise<void>
  markAttended: (queueId) => Promise<void>
  markNoShow: (queueId) => Promise<void>
  reschedule: (queueId) => Promise<void>
  
  // Analytics
  getQueueStats: () => { total, average_wait, max_wait }
  getDayAnalytics: (date) => QueueAnalytics
}
```

**Features**:
- Real-time updates con React Query
- Priorización automática por criticidad
- Auto-escalada si espera > 30 min
- Integración con notificaciones

---

### 2. useQueueNotifications.ts (450 líneas)
**Propósito**: Manage notifications (SMS, email, push)

```typescript
export interface UseQueueNotificationsReturn {
  // Send notifications
  sendSMS: (patientId, message) => Promise<boolean>
  sendEmail: (patientId, subject, body) => Promise<boolean>
  sendPushNotification: (patientId, message) => Promise<boolean>
  sendCall: (patientId) => Promise<boolean>  // Llamada automática
  
  // Query
  getNotificationStatus: (queueId) => NotificationStatus
  getFailedNotifications: () => Notification[]
  
  // Retry logic
  retryFailedNotifications: () => Promise<{ successful, failed }>
}
```

**Features**:
- Fallback si SMS falla (intenta email/push)
- Template notifications
- Rate limiting
- Full audit trail

---

### 3. useQueueAnalytics.ts (400 líneas)
**Propósito**: Análisis de esperas

```typescript
export interface UseQueueAnalyticsReturn {
  getDailyStats: (date) => DailyStats
  getHourlyBreakdown: (date) => HourlyStats[]
  getPriorityDistribution: (date) => PriorityStats
  getNoShowRate: (period) => number
  getTrendLine: (period) => TrendData[]
  
  // Specific room
  getRoomStats: (roomId, period) => RoomStats
  getPeakHours: (roomId) => [number, number][]  // [[9-10], [12-13], ...]
}
```

---

### 4. useRoomConfiguration.ts (450 líneas)
**Propósito**: Manage rooms

```typescript
export interface UseRoomConfigurationReturn {
  allRooms: Room[]
  getRoomById: (id) => Room
  createRoom: (data) => Promise<Room>
  updateRoom: (id, data) => Promise<Room>
  deleteRoom: (id) => Promise<void>
  assignClinic: (roomId, clinicId) => Promise<void>
  
  getRoomCapacity: (roomId) => { current, max }
  isRoomFull: (roomId) => boolean
}
```

---

## ⚡ HITO 4: DENO EDGE FUNCTIONS (1,800 líneas)

### 1. process_queue_call.ts (~350 líneas)
**Propósito**: Llamar siguiente paciente

```typescript
// Triggers:
// - Call next_patient()
// - Send all notifications (SMS/Call/Push)
// - Update queue status
// - Log action
// - Trigger audio announcement

POST /functions/v1/process_queue_call
Body: { room_id, clinic_id? }
Response: { success, patient_called, notifications_sent }
```

---

### 2. send_queue_notifications.ts (~400 líneas)
**Propósito**: Enviar notificaciones (sms, email, push)

```typescript
POST /functions/v1/send_queue_notifications
Body: { 
  queue_entry_id, 
  notification_types: ['sms', 'email', 'push'],
  custom_message?
}
Response: { sent: [], failed: [] }
```

---

### 3. generate_queue_report.ts (~450 líneas)
**Propósito**: Generar reportes de colas

```typescript
POST /functions/v1/generate_queue_report
Query: { period: 'today'|'week'|'month', room_id?, format: 'pdf'|'excel' }
Response: { file_url, statistics }
```

---

### 4. auto_escalate_priority.ts (~350 líneas)
**Propósito**: Auto-escalar prioridad si espera > X minutos

```typescript
// Runs every 5 minutes
// Checks all queue entries
// If waiting_time > 30 min AND current priority < 'high'
//   → Escalate to 'high'
//   → Re-sort queue
//   → Log action
```

---

### 5. manage_room_status.ts (~300 líneas)
**Propósito**: Abrir/cerrar salas, gestionar capacidad

```typescript
POST /functions/v1/manage_room_status
Body: { room_id, action: 'open'|'close'|'pause', reason? }
Response: { success, new_status }
```

---

## 🧪 HITO 5: TEST SUITE (1,000 líneas)

### Test Coverage

**Component Tests** (~450L):
- WaitingRoomDashboard rendering
- QueueManagementPanel interactions
- PatientWaitingScreen updates
- QueueAnalyticsReport generation
- RoomConfigurationPage validation

**Hook Tests** (~350L):
- Queue CRUD operations
- Notification sending
- Analytics calculations
- Room configuration

**Function Tests** (~200L):
- Priority escalation logic
- Notification delivery
- Report generation

---

## 📊 Integración con Otros Módulos

### 1. Con Citas (ASIS 1)
- Paciente con cita → automáticamente en cola
- Status actualiza desde "scheduled" → "waiting" → "attended"

### 2. Con Consultorios
- Cola integrada con disponibilidad de consultorios
- Auto-asignación cuando consultorio libre

### 3. Con Notificaciones HOSIX (Future)
- Reutilizar sistema de notificaciones existente
- Same SMS/email service

### 4. Con Analytics General
- Exportar datos a THALAMUS
- Comparar tiempos entre hospitales

---

## 🔐 Seguridad & Compliance

### HIPAA Compliance
- ✅ Audit log de todos los accesos
- ✅ RLS policies en queue data
- ✅ No mostrar información sensible en pantalla pública
- ✅ Anonimizar reportes cuando es necesario

### Privacy
- ✅ Números de ticket (no nombres) en pantalla pública
- ✅ SMS encriptados
- ✅ Opt-in para notificaciones

---

## 💰 Estimaciones

| Componente | Horas | Líneas | Complejidad |
|-----------|-------|--------|-------------|
| SQL | 8 | 1,200 | Media |
| React | 16 | 2,200 | Media-Alta |
| Hooks | 14 | 1,800 | Media |
| Functions | 12 | 1,800 | Media-Alta |
| Tests | 10 | 1,000 | Media |
| **TOTAL** | **60h** | **8,000L** | **Media** |

---

## 📈 Success Criteria

- ✅ Pantalla de sala se actualiza cada 3s sin lag
- ✅ Notificaciones enviadas en <5 segundos
- ✅ Sistema puede manejar 200+ pacientes en cola
- ✅ 100% de pacientes reciben notificación
- ✅ Tiempo respuesta UI <500ms
- ✅ Reportes generados en <10 segundos

---

## 🎯 Próximos Pasos (WEEK 13+)

- [ ] Integración con sistema de audio de hospital
- [ ] Machine learning para predecir tiempos
- [ ] Integración QR para auto-check-in
- [ ] Feedback de paciente (encuestas post-atención)
- [ ] Optimización para salas especializadas (cirugía, UCI)

---

**Comenzar**: Lunes próximo  
**Deadline**: Fin de semana  
**Status**: 🟡 Pendiente de aprobación final
