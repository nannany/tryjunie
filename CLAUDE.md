# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### UI Development (React/TypeScript)

```bash
cd ui
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Build for production (includes TypeScript compilation)
npm run lint         # Run ESLint
npm run test         # Run tests with Vitest
npm run test:ui      # Run tests with UI
npm run preview      # Preview production build
```

### MCP Server Development

```bash
cd mcp
npm run build        # Build TypeScript and make executable
```

### Supabase Development

```bash
cd supabase
supabase start       # Start local Supabase (API: 54321, Studio: 54323)
supabase stop        # Stop local Supabase
supabase db reset    # Reset database with migrations and seeds
supabase functions serve  # Serve edge functions locally
```

## Architecture Overview

This is a task management application with three main components:

### 1. Frontend (ui/)

- **Tech Stack**: React 19, TypeScript, Vite, Tailwind CSS, Radix UI
- **State Management**: React useReducer with custom taskReducer
- **Authentication**: Supabase Auth with custom RequireAuth wrapper
- **Routing**: React Router with protected routes
- **Key Components**:
  - `TaskList`: Main page with drag-and-drop task reordering using @dnd-kit
  - `IntegrationKeys`: Manage API keys for external integrations
  - Authentication forms (login, register, password reset)

### 2. Backend (supabase/)

- **Database**: PostgreSQL with Row Level Security (RLS)
- **Edge Functions**: Deno-based serverless functions
  - `task-management`: CRUD operations for tasks
  - `search-tasks-per-day`: Query tasks by date
  - `update-task`: Update task properties
- **Key Tables**:
  - `tasks`: Core task data with user_id, title, estimated_minute, task_order, task_date
  - `integration_keys`: API keys for external service integration

### 3. MCP Server (mcp/)

- **Purpose**: Model Context Protocol server for external task management integration
- **Tools**: create_task, search_tasks_per_day
- **Integration**: Uses X_INTEGRATION_ID header for authentication

## Key Development Patterns

### Task Management

- Tasks are scoped by user_id and task_date
- Uses task_order for drag-and-drop positioning
- Estimated time in minutes, not hours
- Inline editing for task properties

### Authentication Flow

- Supabase Auth with email/password
- User context provided via UserProvider
- Protected routes with RequireAuth component
- RLS policies enforce user data isolation

### State Management

- Tasks managed via useReducer with actions: SET_TASKS, ADD_TASK, UPDATE_TASK, DELETE_TASK, REORDER_TASKS
- Optimistic updates with error handling and rollback

### API Integration

- Supabase client configured via environment variables
- Edge functions handle complex business logic
- MCP server enables external tool integration

## Environment Variables

### UI (.env)

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### MCP Server

```
X_INTEGRATION_ID=your_integration_id
```

## Testing

- Frontend: Vitest with React Testing Library
- Edge Functions: Deno test framework
- Manual testing guide available for task-management function

## Build Requirements and Quality Gates

**CRITICAL**: Before completing any task, ALL of the following must pass:

### 1. TypeScript Compilation
```bash
cd ui
npm run build
```
- **Must succeed without errors**
- **Must not use `any` types** - Use proper TypeScript interfaces
- **Must not have unsafe type assertions** - Prefer type guards over `as unknown as`

### 2. Code Formatting
```bash
npx prettier --check "ui/**/*.{ts,tsx,js,jsx,json,md,yml}"
```
- **Must pass without formatting issues**

### 3. Tests
```bash
cd ui
npm test
```
- **All tests must pass**

### Common TypeScript Issues to Avoid

1. **Never use `any` types**:
   ```typescript
   // ❌ Bad
   editingField: any;
   
   // ✅ Good
   editingField: EditingField | null;
   ```

2. **Use proper type imports**:
   ```typescript
   // ✅ Import types when needed
   import { EditingField } from "./types";
   ```

3. **Avoid unsafe type assertions**:
   ```typescript
   // ❌ Avoid this pattern
   (data as unknown as Category[])
   
   // ✅ Prefer type guards or proper types
   data as Category[]
   ```

4. **Ensure prop interfaces match usage**:
   - When adding new props, update both interface definitions and component usage
   - TaskEditProps should match actual component prop requirements

### Build Failure Recovery

If `npm run build` fails:
1. Read the TypeScript error carefully
2. Fix type issues systematically
3. Never suppress errors with `any` types
4. Update interfaces to match actual usage
5. Test the build again before considering task complete

## Memories

- Be sure to run test as a completion check.
- As a condition for completion, make sure that the npm run build succeeds
- As a condition for completion, make sure that the `npx prettier --check "ui/**/*.{ts,tsx,js,jsx,json,md,yml}"` succeeds
