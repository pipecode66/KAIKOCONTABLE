# KAIKO Contable

Base real de un SaaS contable multiempresa construido con:

- Next.js 16 App Router
- TypeScript estricto
- PostgreSQL + Prisma
- Tailwind CSS + shadcn/ui
- Auth.js v5 + Prisma Adapter
- Zod + React Hook Form

## Estado actual

Esta implementación deja lista la fundación del producto:

- arquitectura modular por dominio en `src/modules`
- shell UI KAIKO con landing, login y workspace multiempresa
- Auth.js v5 con credenciales, sesiones persistidas y encapsulación en `src/lib/auth`
- schema Prisma completo para identidad, catálogos, operación, contabilidad, tesorería, auditoría, idempotencia, jobs y outbox
- migración inicial generada en `prisma/migrations/0001_init/migration.sql`
- seeds base y demo en `prisma/seed`
- logger estructurado, correlation id, políticas de retención, jobs y mantenimiento

## Versiones críticas fijadas

- `next-auth@5.0.0-beta.30`
- `@auth/prisma-adapter@2.11.0`
- `@prisma/client@6.19.2`
- `prisma@6.19.2`

La combinación de Auth.js quedó pineada de forma explícita para que `package.json` y `pnpm-lock.yaml` sean reproducibles.

## Estructura

```text
src/modules/<module>/
  domain/{entities,value-objects,rules,services}
  application/{use-cases,commands,queries,guards}
  infrastructure/{prisma,mappers,repositories,adapters}
  ui/{pages,components,forms,tables}
  validators/
  dto/
```

Capas transversales:

- `src/lib/jobs`: cola, retry y runner técnico
- `src/lib/outbox`: transactional outbox y dispatcher
- `src/lib/maintenance`: cleanup, archive y políticas de retención
- `src/lib/money`: precisión decimal y redondeo
- `src/lib/observability`: logger y contexto operativo

## Variables de entorno

Usa `.env.example` como base. Para desarrollo local se dejó un `.env` de bootstrap con valores placeholder.

Variables mínimas:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `APP_URL`
- `INTERNAL_CRON_TOKEN`
- `MAIL_FROM`
- `SMTP_HOST`
- `SMTP_PORT`

## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm db:generate`
- `pnpm db:migrate:diff`
- `pnpm db:push`
- `pnpm db:seed`

## Despliegue en Vercel

Archivos y convenciones dejados listos para producción:

- `vercel.json` con cron jobs base y configuración del proyecto
- `.vercelignore` para evitar subir artefactos locales
- `postinstall` ejecuta `prisma generate` en la instalación del build
- rutas internas de jobs y maintenance compatibles con Vercel Cron (`Authorization: Bearer $CRON_SECRET`)

Variables mínimas a configurar en Vercel:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `APP_URL`
- `INTERNAL_CRON_TOKEN`
- `CRON_SECRET`
- `MAIL_FROM`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`

Notas operativas:

- Los cron jobs de `vercel.json` corren en UTC.
- `CRON_SECRET` se usa para cron de Vercel.
- `INTERNAL_CRON_TOKEN` se mantiene para ejecución manual o automatización privada fuera de Vercel.
- Si la contraseña de PostgreSQL contiene caracteres reservados como `#`, debe ir URL-encoded en `DATABASE_URL`.

## Flujo de datos crítico

### Auth

- login por credenciales con Auth.js v5
- cookie de sesión en JWT, que es el modo compatible del provider `credentials` en este beta
- espejo de sesión persistido en base de datos desde `src/lib/auth/persisted-session.ts`
- cookies `httpOnly`
- organización activa resuelta por membership

### Outbox y jobs

1. un caso de uso de negocio persiste cambios
2. dentro de la misma transacción puede persistir `OutboxMessage`
3. el dispatcher convierte mensajes pendientes en `AsyncJob`
4. los runners técnicos procesan jobs y tareas de maintenance

Usa outbox cuando el side effect deba quedar garantizado junto con el commit. Usa enqueue directo para mantenimiento o tareas técnicas no críticas.

### Retención operativa

- `PasswordResetToken`: expira y luego se marca como `EXPIRED`
- `Session`: purge de expiradas/revocadas
- `IdempotencyRecord`: expira, se archiva y luego puede purgarse
- `AsyncJob`: retry + dead-letter + archivado
- `AuditLog`: archivado, no purge agresivo por defecto
- `Attachment` temporal: purge controlado

## Notas de implementación

- Todos los montos monetarios usan `Decimal @db.Decimal(18, 2)`.
- Tasas e impuestos usan `Decimal @db.Decimal(7, 4)`.
- `OrganizationSettings` es 1:1 con `Organization`.
- `Organization.baseCurrencyId` deja explícita la monomoneda del MVP.
- La UI ya navega por módulos, pero todavía hay flujos que están en estado base/placeholder para el siguiente tramo de desarrollo: recuperación de contraseña completa, CRUDs avanzados y posteo contable end-to-end desde formularios.

## Verificación realizada

- `pnpm exec prisma validate`
- `pnpm exec prisma generate`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run build`

## Pendiente para el siguiente tramo

- server actions y CRUDs completos por módulo
- recuperación de contraseña end-to-end con correo
- posteo automático de documentos operativos hacia `JournalEntry`
- conciliación bancaria asistida con matching real
- reportes financieros conectados a datos persistidos
- pruebas unitarias e integración automatizadas
