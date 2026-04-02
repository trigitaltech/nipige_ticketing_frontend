# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev       # Start dev server on port 3000
npm run build     # Production build (Vite)
npm run lint      # ESLint check
npm run preview   # Preview production build
```

## Architecture

**React 19 + Redux Toolkit** ticketing/task management app built with Vite. Pure JavaScript (no TypeScript).

### Navigation

No React Router — navigation uses state-based conditional rendering. `App.jsx` toggles between Login and Dashboard based on `isAuthenticated`. `Dashboard.jsx` manages `activePage` state to switch between pages (Dashboard, Projects). Ticket details render as a full-page overlay, not a separate route.

### State Management

Redux Toolkit with slices in `src/redux/`:
- `authSlice` — login, logout, password change; persisted to localStorage
- `ticketSlice` — CRUD + comments + filtering for tickets
- `projectSlice` — CRUD for projects
- `categorySlice` — ticket categories
- `userSlice` — user list

All API calls use `createAsyncThunk`. Auth token auto-injected via Axios interceptors; 401 responses trigger auto-logout.

### Dual API Clients

Two Axios instances in `src/services/api.js`:
- `api` — points to `dev.app.trigital.in` (auth, users)
- `nipige` — points to `dev.app.nipige.com` (tickets, projects, categories)

Both share the same request/response interceptor pattern for token injection and error handling. Project-specific API calls are in `src/services/projectApi.js`.

### Component Organization

- `src/components/layout/` — Header, Sidebar, SearchFilterBar
- `src/components/ticketing/` — KanbanBoard, ListView, TicketCard, CreateTicketModal, UpdateTicketModal, FilterBar, TicketInfoPanel
- `src/components/shared/` — AlertModal, DeleteConfirmModal, FilterDropdown, SearchBar, SortDropdown
- `src/components/profile/` — ChangePasswordModal, ProfileDropdown
- `src/pages/` — Dashboard, TicketDetailsPage, ProjectMaster, ProjectDetailsPage

### Key Patterns

- **Kanban drag-and-drop**: Native HTML5 drag events in KanbanBoard; only works when grouped by status
- **Optimistic updates**: Kanban status changes update UI immediately, then confirm via API
- **Multi-view**: Dashboard supports Kanban and List views with grouping by status/project/category
- **File uploads**: Base64 encoding via utility in `src/function/function.js`
- **Styling**: Tailwind CSS + component-specific CSS files in `src/assets/Styles/`
- **Date formatting**: Custom IST timezone handling (UTC+5:30)
