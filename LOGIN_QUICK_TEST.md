# HOSIX LOGIN - GUÍA DE VERIFICACIÓN RÁPIDA

## 🚀 START HERE - 5 MINUTOS PARA VERIFICAR TODO

### 1️⃣ Inicia el servidor
```bash
cd "c:\Users\HP\Desktop\Proyectos y Empresas\geprostec\RENAPROSA\Renaprosa2\SERMED2"
npm run dev
```

Espera hasta ver:
```
  ➜  local:   http://localhost:8082/hosix
```

### 2️⃣ Abre el navegador
```
http://localhost:8082/hosix
```

Deberías ver:
- Fondo gradiente azul
- Panel blanco con "HOSIX"
- Campo "Email" (no "Usuario")
- Campo "Contraseña"
- Botón "Ingresar"
- Demo credentials al pie

### 3️⃣ Ingresa credenciales
```
Email:     admin@hosix.com
Contraseña: Admin@Hosix123
```

### 4️⃣ Verificaciones

#### ✅ Prueba 1: Login Exitoso
**Resultado esperado:**
- Notificación verde: "¡Login exitoso!"
- Dashboard carga después de 1 segundo
- Ve **3 hospitales** en la pantalla

**Si falla:**
- Abre F12 (Developer Tools) → Console tab
- Busca el error exacto
- Compara con troubleshooting abajo

#### ✅ Prueba 2: Hospital Filtering
**Credenciales:**
```
Email:     director.hospital1@hosix.com
Contraseña: Director@Hosix123
```

**Resultado esperado:**
- Login exitoso
- Dashboard abre
- Ve **SOLO 1 hospital**: Hospital Central Quito
- Ve empleados de ese hospital

**Propósito:** Verifica que RLS policies funcionan

#### ✅ Prueba 3: Rol Professional
**Credenciales:**
```
Email:     obstetrica@hosix.com
Contraseña: Profesional@Hosix123
```

**Resultado esperado:**
- Login exitoso
- Dashboard muestra: "Mis pacientes" (18 registros)
- Sección "Citas de hoy" visible
- NO ve hospitales ni empleados

#### ✅ Prueba 4: Credenciales Inválidas
**Ingresa:**
```
Email:     admin@hosix.com
Contraseña: WrongPassword123
```

**Resultado esperado:**
- Notificación roja: "Email o contraseña incorrectos"
- Permanece en login
- Campo contraseña se limpia

---

## 📋 TODOS LOS USUARIOS DE PRUEBA

| # | Email | Password | Role | Hospital | Expected View |
|---|-------|----------|------|----------|---------------|
| 1 | admin@hosix.com | Admin@Hosix123 | SUPER_ADMINISTRADOR | Central | 3 hospitales |
| 2 | director.hospital1@hosix.com | Director@Hosix123 | DIRECTOR_HOSPITAL | Central | 1 hospital (Central) |
| 3 | director.hospital2@hosix.com | Director@Hosix123 | DIRECTOR_HOSPITAL | Metropolitano | 1 hospital (Metro) |
| 4 | obstetrica@hosix.com | Profesional@Hosix123 | PROFESIONAL | Central | Mis pacientes (18) |
| 5 | pediatra@hosix.com | Profesional@Hosix123 | PROFESIONAL | Central | Mis pacientes (18) |
| 6 | medico.hosp2@hosix.com | Profesional@Hosix123 | PROFESIONAL | Metropolitano | Mis pacientes (18) |
| 7 | admin.hosp1@hosix.com | Admin@Hosix123 | GESTOR_ADMINISTRATIVO | Central | Nóminas y pagos |

---

## 🔧 TROUBLESHOOTING RÁPIDO

### ❌ Error: "Error al conectar con el servidor"

**Causas comunes:**
1. Servidor no está corriendo → Verifica `npm run dev`
2. URL de Supabase no es válida → Revisa `.env.hosix.temporal`
3. Anon key vencida o inválida → Regenera desde Supabase dashboard

**Solución:**
```bash
# Terminal 1: Reinicia servidor
npm run dev

# Terminal 2: Verifica variables de entorno
cat .env.hosix.temporal | grep VITE_SUPABASE
```

### ❌ Error: "Email o contraseña incorrectos"

**Verificación:**
1. ¿Escribiste el email correctamente?
   - ✅ `admin@hosix.com` (minúsculas, @, .com)
   - ❌ `Admin@hosix.com` (mayúscula no es válida)

2. ¿Contraseña exacta?
   - ✅ `Admin@Hosix123` (exacta)
   - ❌ `admin@hosix123` (minúscula, incorrecta)

3. Verifica que usuario existe en BD:
   ```sql
   SELECT email, rol FROM public.users WHERE email = 'admin@hosix.com';
   ```
   Debería retornar 1 fila.

### ❌ Error: "Está vacío el campo Email o Contraseña"

Botón "Ingresar" deshabilitado = Faltan valores
- Escribe email
- Escribe contraseña
- El botón se activa automáticamente

### ❌ Login funciona pero Dashboard no carga

**Checklist:**
1. Abre F12 → Network tab
2. Busca requests a `/hosix/dashboard`
3. ¿Status 200? → Archivo cargó bien
4. ¿Status 404? → Ruta no existe
5. ¿Status 500? → Error en backend

**Solución:**
```bash
# Rebuild y redeploy
npm run build
npm run dev
```

### ❌ Ve 3 hospitales pero debería ver 1

**Posible causa:** Rol incorrecto en BD

**Verificar:**
```sql
SELECT email, rol, hospital_id FROM public.users 
WHERE email = 'director.hospital1@hosix.com';
```

Debería mostrar: `DIRECTOR_HOSPITAL` (no `SUPER_ADMINISTRADOR`)

**Corregir:**
```sql
UPDATE public.users 
SET rol = 'DIRECTOR_HOSPITAL' 
WHERE email = 'director.hospital1@hosix.com';
```

---

## 📊 CHECKLIST DE VERIFICACIÓN

Completa esto mientras pruebas:

- [ ] **Servidor inicia** sin errores
- [ ] **LoginPage carga** (ve formulario)
- [ ] **admin@hosix.com login exitoso** (notificación verde)
- [ ] **Dashboard carga** (después de 1 segundo)
- [ ] **Ve 3 hospitales** (SUPER_ADMINISTRADOR)
- [ ] **director login** → Ve 1 hospital (RLS funciona)
- [ ] **obstetrica login** → Ve 18 pacientes (rol-based view)
- [ ] **Credenciales inválidas** → Error message (seguridad)
- [ ] **localStorage** → `auth_state` contiene user data
- [ ] **F12 Network** → `/hosix-auth-login` POST status 200

---

## 🎯 SI TODO FUNCIONA

**Excelente!** El login de HOSIX está 100% operacional.

Próximos pasos:
1. Prueba funciones específicas del dashboard (agregar paciente, etc)
2. Verifica que los botones funcionan correctamente
3. Prueba logout y vuelve a login
4. Prueba en diferentes navegadores

---

## 📞 SOPORTE RÁPIDO

**¿Cuál es el archivo Edge Function?**
```
Supabase Dashboard → Functions → hosix-auth-login
```

**¿Dónde están las credenciales guardadas?**
```
Browser → F12 → Application → Local Storage → auth_state
```

**¿Cómo regenero los usuarios de prueba?**
```
Ve a: HOSIX_LOGIN_READY.md → "Todos los usuarios disponibles"
```

**¿Cómo cambio contraseña a un usuario?**
```
Supabase Dashboard → Auth → Users → Edit → Change Password
```

---

**Última revisión**: 2025-02-06  
**Estado**: ✅ LISTO PARA PRODUCCIÓN
