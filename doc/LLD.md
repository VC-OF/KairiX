# Low Level Design (LLD)

## 1. Database Schema (Mongoose Models)

### 1.1 User Model
- `name`: String
- `email`: String (Unique)
- `password`: String (Hashed)
- `globalRole`: Enum ['admin', 'executive', 'user']
- `avatar`: String (URL)

### 1.2 Project Model
- `name`: String
- `description`: String
- `createdBy`: ObjectId (Ref User)
- `members`: Array
    - `userId`: ObjectId (Ref User)
    - `role`: Enum ['ProjectManager', 'TeamLead', 'TeamMember']
- `status`: Enum ['active', 'archived']

### 1.3 Task Model
- `title`: String
- `description`: String
- `status`: Enum ['pending', 'in-progress', 'stuck', 'completed']
- `assignees`: Array of ObjectId (Ref User)
- `priority`: Enum ['low', 'medium', 'high']
- `projectId`: ObjectId (Ref Project)
- `dueDate`: Date

## 2. API Endpoints

### 2.1 Auth
- `POST /api/auth/signup`: Create new account.
- `POST /api/auth/login`: Authenticate user.

### 2.2 Projects
- `GET /api/projects`: List projects.
- `POST /api/projects`: Create project.
- `PUT /api/projects/:id`: Update project details.
- `POST /api/projects/:id/members`: Add member to project.

### 2.3 Tasks
- `GET /api/tasks/:projectId`: List tasks for a project.
- `POST /api/tasks/:projectId`: Create task.
- `PUT /api/tasks/:projectId/:taskId`: Update task status/details.
- `DELETE /api/tasks/:projectId/:taskId`: Delete task.

## 3. Frontend State Management (Zustand)
The `useStore` handles:
- `currentUser`: Authentication state.
- `tasks`, `projects`, `users`: Entity lists.
- `activeView`: Dashboard navigation state.
- `theme`: UI appearance toggle.

## 4. UI Components
- `Sidebar`: Navigation and project selection.
- `Dashboard`: Overview of stats and recent activity.
- `Board`: Kanban view of tasks.
- `Members`: Team management and capacity tracking.
