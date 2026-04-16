# Module 00-core: Authentication

## 📖 Description

Authentication and authorization system for HOSIX. Includes user login, registration, role-based access control (RBAC), and permission management.

Based on Supabase Auth + custom RBAC layer.

## 🎯 Objectives

- [x] User authentication (login/register)
- [x] Password reset flow
- [ ] 2FA support
- [ ] Session management
- [ ] Permission validation

## 🗂️ Structure

```
auth/
├── components/
│   ├── EnhancedLoginForm.tsx
│   ├── RegistrationForm.tsx
│   ├── PasswordResetForm.tsx
│   ├── PermissionGuard.tsx
│   ├── RoleBasedRoute.tsx
│   └── UserProfileForm.tsx
├── hooks/
│   └── usePermissions.ts
├── types/
│   └── auth.types.ts
├── services/
│   └── authService.ts
├── index.ts
└── README.md
```

## ✅ Checklist

- [x] Components created and working
- [x] Hooks implemented
- [x] Types defined
- [ ] Tests written
- [ ] Documentation complete

## 🔗 Dependencies

- None (Core module - no internal dependencies)

## 📝 Notes

This module is the foundation for all auth-dependent modules.
