# KairiX: High-Performance Execution OS (PRD)
**Version**: 2.0.0  
**Status**: Phase 1 Complete | Phase 2 In Progress  
**Identity**: AI-Powered Operational Command Center for Engineering Teams

---

## 1. Executive Summary & Vision
KairiX is designed to bridge the gap between traditional task management (Jira/Monday) and the modern AI-native workspace. It treats project management as a **real-time execution stream**, where every action, time log, and status update feeds into a centralized intelligence engine.

The core goal is to eliminate "management overhead" by using AI to automate task breakdowns, risk detection, and team standups, allowing engineers to stay in "Deep Work" states longer.

---

## 2. System Hierarchy & Domain Structure

### 2.1 Organizational Layers
The system implements a multi-tenant, recursive hierarchy to support both startups and enterprise-scale organizations:

1.  **Workspace**: The root tenant isolation layer (e.g., "Acme Corp").
2.  **Teams**: Departmental or functional groupings (e.g., "Frontend Team").
3.  **Projects**: Specific high-level initiatives with defined goals and members.
4.  **Epics**: Large bodies of work that can be broken down into multiple tasks.
5.  **Sprints**: Time-boxed execution cycles (typically 14 days) with velocity tracking.
6.  **Tasks**: The primary unit of work.
7.  **Subtasks**: Granular execution steps within a task.

### 2.2 Project Visibility & Security States
*   **Public**: Open to all users within the Workspace.
*   **Restricted**: Membership-locked; requires explicit assignment.
*   **Admin-Only**: Hidden from everyone except Master Admins.
*   **Locked State**: When `isLocked: true`, the project becomes read-only for non-Admins to prevent modification of finalized data.

---

## 3. User Roles & Access Control (RBAC)

### 3.1 Role Personas
*   **Master Admin (`admin`)**:
    *   Global visibility across all Workspaces and Projects.
    *   Manage user roles, billing, and system-wide settings.
    *   Bypass "Locked" project restrictions.
*   **Admin (`executive`)**:
    *   Manage specific Teams and Projects.
    *   Assign/Remove members and manage project configurations.
    *   Access to detailed team productivity analytics.
*   **Employee (`user`)**:
    *   View and interact with assigned projects/tasks.
    *   Log time, create daily updates, and manage personal notifications.
    *   Cannot modify project-level settings or global roles.

---

## 4. Functional Modules (Implemented & Roadmap)

### 4.1 Task Execution & Kanban
*   [x] **Real-Time Board**: Low-latency drag-and-drop powered by Socket.io.
*   [x] **Prioritization Engine**: Support for Critical, High, Medium, and Low flags.
*   [ ] **Sprint Planning**: (Roadmap) Backlog grooming, story point estimation, and sprint activation.
*   [ ] **Dependency Management**: (Roadmap) "Blocked-by" relationships with visual dependency graphs.

### 4.2 Time Tracking & Allocation
*   [x] **Global Tracker**: A persistent, draggable floating UI for seamless tracking across pages.
*   [x] **Task Timers**: Start/Stop functionality directly on Kanban cards.
*   [x] **Member Allocation Guard**: Conflict detection logic that warns when a user is assigned to multiple High-Priority projects simultaneously.
*   [ ] **Idle Detection**: (Roadmap) AI-driven heuristics to detect and pause timers when no user activity is detected.

### 4.3 Intelligence & Analytics (BI)
*   **Implemented (v1)**:
    *   [x] Individual Efficiency Score: `(Tasks Completed / Hours Worked) * 10`.
    *   [x] Performance Trends: Daily/Weekly/Monthly productivity area charts.
    *   [x] Project Status Breakdown: Completed vs. Pending vs. Overdue stats.
*   **Roadmap (v2)**:
    *   [ ] **Weighted Efficiency**: `(Points / FocusedHours) * QualityMultiplier`.
    *   [ ] **Burnout Probability**: Detection of sustained high-intensity periods.
    *   [ ] **Delivery Prediction**: AI-estimated ETA based on current team velocity.

### 4.4 Operational Logs & Collaboration
*   [x] **Daily Status Stream**: A chronological timeline of updates, achievements, and blockers.
*   [x] **Achievement Linking**: Automatically attach completed tasks to daily logs.
*   [x] **Blocker Highlighting**: Dedicated UI treatment for "Blocked" status updates.
*   [ ] **Threaded Comments**: (Roadmap) Markdown-enabled conversations with @mentions.

---

## 5. AI Intelligence Suite (Phase 2 & 3)

### 5.1 AI Copilot
*   **Task Breakdown**: Automatically generate a list of subtasks from a single task title/description.
*   **Description Autocomplete**: AI-suggested technical documentation for new tasks.
*   **Smart Assignment**: Recommend the best developer for a task based on expertise and current workload.

### 5.2 AI Command & Reporting
*   **AI Standup Generator**: Collates a user's logs, commits, and task moves into a clean "What I did today" summary.
*   **Risk Detection**: Alerts managers to tasks that have been "In Progress" for significantly longer than estimated.
*   **Semantic Search**: Search the system using natural language (e.g., "Show me everything blocked by frontend bugs").

---

## 6. Technical Architecture (Deep Dive)

### 6.1 Frontend Stack
*   **Framework**: React with TypeScript.
*   **State Management**: Zustand (for real-time synchronization and UI state).
*   **Charts**: Recharts (Customized for dual-axis productivity views).
*   **Animations**: Framer Motion (for premium UI micro-interactions).

### 6.2 Backend Stack
*   **Engine**: Node.js (Express).
*   **Real-Time**: Socket.io (using Room-based isolation per Project).
*   **Database**: MongoDB with Mongoose ODM.
*   **Analytics**: Multi-stage aggregation pipelines for cross-collection metrics.

### 6.3 Real-Time Architecture Logic
*   **Event Cycle**: 
    1.  User moves a Kanban card.
    2.  REST API handles the database update and permission check.
    3.  Backend emits `task_updated` to the specific `projectId` socket room.
    4.  All connected clients in that project receive the update and re-sync their local store.

### 6.4 Security Infrastructure
*   **Authentication**: JWT (JSON Web Tokens) with a 24-hour expiration.
*   **Middleware Gating**:
    *   `authenticateToken`: Global identity verification.
    *   `hasProjectAccess`: Granular membership verification.
    *   `requireLockedAccess`: Blocks modifications if a project is locked.
*   **Audit Layer**: (Roadmap) Immutable activity logs for every record mutation.

---

## 7. Infrastructure Roadmap & Scaling

### 7.1 Data & Search Scaling
*   **Current**: MongoDB `$regex` for global search.
*   **Target**: **Meilisearch** integration for high-performance, typo-tolerant search indexing.
*   **Vector Engine**: Integration of **Pinecone** to support AI context memory and semantic retrieval.

### 7.2 Multi-Tenant Scaling
*   **Isolation**: Every collection entry contains a `workspaceId` or `tenantId`.
*   **Event Bus**: Migration to **Redis Pub/Sub** to allow Socket.io to function across multiple server instances.
*   **Worker System**: Introduction of **BullMQ** for background tasks (AI processing, email digests).

---

## 8. UI/UX Design System: "Alien AI"
*   **Aesthetic**: Glassmorphism, high-contrast dark mode, and vibrant neon accents.
*   **Design Tokens**:
    *   Primary: `#8b5cf6` (Violet)
    *   Success: `#10b981` (Emerald)
    *   Warning: `#f59e0b` (Amber)
    *   Danger: `#ef4444` (Rose)
*   **Typography**: Inter/Outfit for high readability and a futuristic technical feel.

---

## 9. API Reference & Standards
*   **API Versioning**: Current version `/api/v1/`.
*   **Payload Limits**: Extended to `50MB` for media-heavy logs and profile assets.
*   **Rate Limiting**: `1000 requests / 15 minutes` per IP to prevent scraping and abuse.

---

## 10. Development Roadmap & Milestones

### Phase 1: Core Foundation (Current State)
*   [x] Real-time Kanban & Workspace Navigation.
*   [x] RBAC & Project Security.
*   [x] Global Time Tracking & v1 Analytics.
*   [x] Daily Status Logs & File Management.

### Phase 2: Intelligent Execution (Next)
*   [ ] Sprint & Scrum Engine.
*   [ ] Task Dependencies & Subtasks.
*   [ ] AI Copilot (Task Breakdown & Summaries).
*   [ ] Threaded Comments & Mentions.

### Phase 3: Autonomous Command Center
*   [ ] Multi-Tenant SaaS Infrastructure.
*   [ ] Advanced AI (Predictive Analytics & Risk Detection).
*   [ ] Semantic Vector Search.
*   [ ] Mobile PWA & Offline Support.

---
© 2026 KairiX Operational Systems. All Rights Reserved.
