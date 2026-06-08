# StudyPilot

**StudyPilot** is a full-stack academic planning and grade tracking application designed to help students organize classes, manage assignments, monitor grades, and decide what to work on next.

Instead of being a simple to-do list, StudyPilot connects assignments to specific classes, tracks assignment progress, separates current and completed work, and calculates current grades based on graded assignments.

---

## Overview

StudyPilot is built for students who want one place to manage their academic workload. The app allows users to create their own quarter-based class schedule, add assignments for each class, track assignment status, and view past graded work.

The project was designed to be clean and simple on the frontend while using more advanced logic behind the scenes, including REST API routes, persistent database storage, assignment priority scoring, and grade calculations.

---

## Features

### Class Management

- Add new classes dynamically
- Store class name, course code, instructor, quarter, year, target grade, and notes
- Delete classes when they are no longer needed
- View current grade and target grade for each class

### Assignment Management

- Add assignments connected to specific classes
- Edit existing assignments without deleting and recreating them
- Delete assignments
- Track due dates
- Track estimated hours
- Track difficulty level
- Track assignment status

Assignment statuses include:

- `Not Started`
- `In Progress`
- `Submitted`
- `Graded`

### Current and Past Assignments

StudyPilot separates assignments into two main sections:

- **Current Assignments**
  - Not Started
  - In Progress
  - Submitted

- **Past Assignments**
  - Graded assignments only

This keeps active work separate from completed work.

### Filtering

- Filter current assignments by class
- Filter past assignments by class
- Keep assignments organized when managing multiple courses

### Grade Tracking

- Enter score received and points possible for graded assignments
- Automatically calculate current grade for each class
- Display current grade next to the target grade in the class card

### Priority Score System

StudyPilot calculates an assignment priority score using:

- Due date urgency
- Assignment difficulty
- Estimated hours
- Current status

This helps students quickly identify which assignments deserve the most attention.

---

## Tech Stack

### Frontend

- React
- Vite
- Axios
- CSS

### Backend

- Node.js
- Express
- CORS
- Nodemon

### Database

- SQLite
- better-sqlite3

---

## Project Structure

```text
StudyPilot/
│
├── backend/
│   ├── database.js
│   ├── server.js
│   ├── package.json
│   └── studypilot.db
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
