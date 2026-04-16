# 🔐 FASE 3 - Module 14: Authentication & Authorization Enhancement

**Status:** ⏳ **IN PROGRESS**  
**Start Date:** April 16, 2026  
**Target Completion:** April 18, 2026  

---

## 📋 Module 14 Objectives

### Core Deliverables
1. Enhanced login/registration forms
2. Password reset functionality
3. Role-based access control (RBAC)
4. Permission checks component
5. User profile management
6. Session/token management

### Components to Build

```typescript
// Authentication Components
├── LoginForm.tsx (enhanced)
├── RegisterForm.tsx (new)
├── PasswordResetForm.tsx (new)
├── PasswordChangeForm.tsx (new)
├── UserProfileForm.tsx (new)
├── RoleSelector.tsx (new)
├── PermissionsList.tsx (new)
└── SessionManager.tsx (new)

// Guards & Protection
├── RequirePermission.tsx (new)
├── RequireRole.tsx (new)
└── AuthGuard.tsx (new)
```

---

## 🛠️ Implementation Plan

### Phase 1: Enhanced Authentication
- [ ] Create extended login form with remember-me
- [ ] Implement registration form
- [ ] Add password reset flow
- [ ] Create password change interface

### Phase 2: Role & Permission System
- [ ] Create permission check hook
- [ ] Build permission guard component
- [ ] Implement role-based route guards
- [ ] Create permission list component

### Phase 3: User Management
- [ ] Build user profile page
- [ ] Create profile update form
- [ ] Add session management
- [ ] Implement two-factor authentication (optional)

---

## 🔌 Integration Points

### FASE 2 Tables:
- `hosix_usuarios` - User data
- `hosix_perfiles` - Role definitions
- `hosix_permisos` - Permission mappings

### Edge Functions:
- `hosix-auth-login` ✅ (already deployed)
- `hosix-permisos-check` ✅ (already deployed)
- `hosix-auditoria-eventos` (for logging)

---

## 📝 Example Code Structure

```typescript
// Module imported from earlier Module 13
import { useApp, useAuth, useNotifications } from '../hooks/useApp';
import { User, PermissionLevel } from '../types';

// New hooks to create
export const usePermissions = (usuarioId: string) => {
  const [permissions, setPermissions] = useState<PermissionLevel[]>([]);
  
  const hasPermission = (modulo: string, accion: string) => {
    return permissions.some(p => 
      p.modulo === modulo && p.accion === accion && p.tiene_permiso
    );
  };
  
  return { permissions, hasPermission };
};

// New guard component
export const RequirePermission = ({ 
  modulo, 
  accion, 
  children 
}: { 
  modulo: string; 
  accion: 'leer' | 'crear' | 'editar' | 'eliminar' | 'aprobar'; 
  children: ReactNode; 
}) => {
  const { auth } = useAuth();
  const { hasPermission } = usePermissions(auth.user?.id || '');
  
  return hasPermission(modulo, accion) ? <>{children}</> : null;
};
```

---

## ✅ Success Criteria

- [ ] Login/register/password reset fully functional
- [ ] Permission checks working with edge functions
- [ ] Role-based route guards preventing unauthorized access
- [ ] User profile management operational
- [ ] Audit logging for auth events
- [ ] No TypeScript errors
- [ ] All components tested (Phase 22)

---

## 🚀 Quick Implementation Timeline

**Day 1-2:** Enhanced auth forms  
**Day 2-3:** Permission system  
**Day 3:** User profile & session mgmt  

---

## 📌 Developer Notes

- Use existing `useApp` context from Module 13
- Follow the same component structure
- Maintain TypeScript strict mode
- Use edge functions for all backend operations
- Add loading and error states

---

**Linked Issue:** N/A  
**PR Template:** See CONTRIBUTING.md  
**Review Checklist:** Module 14 Review

---

**Next Module:** Module 15 - Patient Management Views
