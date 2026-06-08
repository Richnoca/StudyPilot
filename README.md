# 🚀 StudyPilot

**StudyPilot** is a full-stack academic planning and grade tracking application that helps students organize classes, manage assignments, track grades, and decide what to work on next.

Instead of acting like a basic to-do list, StudyPilot connects assignments to specific classes, separates current and completed work, supports grade categories, and uses a priority score system to highlight the most important assignments.

---

## 📌 Overview

StudyPilot was built for students who want one organized place to manage their academic workload.

Users can create a quarter-based class schedule, add assignments for each class, track assignment progress, view graded work, and monitor course performance.

The project uses a clean frontend design with more advanced full-stack logic behind the scenes, including:

* REST API routes
* SQLite database storage
* Relational data between classes, assignments, and grade categories
* Assignment priority scoring
* Grade category support
* Dashboard summary cards
* Sorting and filtering

---

## ✨ Features

### 📚 Class Management

* Add classes dynamically
* Store class name, course code, instructor, quarter, year, target grade, and notes
* Delete classes
* View current grade and target grade for each class
* Organize classes by quarter

---

### 📝 Assignment Management

* Add assignments connected to specific classes
* Edit existing assignments
* Delete assignments
* Track due dates
* Track estimated hours
* Track difficulty level
* Track assignment status
* Assign grade categories to assignments

Assignment statuses include:

* `Not Started`
* `In Progress`
* `Submitted`
* `Graded`

---

### ✅ Current and Past Assignments

StudyPilot separates assignments into two sections:

**Current Assignments**

* Not Started
* In Progress
* Submitted

**Past Assignments**

* Graded assignments

This keeps active work separate from completed work.

---

### 🔎 Filtering and Sorting

Users can:

* Filter current assignments by class
* Filter past assignments by class
* Sort assignments by priority
* Sort assignments by due date
* Sort assignments by class
* Sort assignments by difficulty
* Sort assignments by estimated hours

---

### 📊 Dashboard

The dashboard provides a quick overview of important academic information:

* Highest priority assignment
* Assignments due this week
* Average current grade
* Submitted assignments waiting for grades

---

### 🎯 Priority Score System

StudyPilot calculates a priority score to help students decide what to work on first.

The score is based on:

* Due date urgency
* Assignment difficulty
* Estimated hours
* Assignment status

Assignments that are due soon, difficult, time-consuming, and not started receive higher priority scores.

---

### 🧮 Grade Categories

Users can create grade categories for each class.

Example:

* Homework: 25%
* Projects: 35%
* Quizzes: 10%
* Final: 30%

Assignments can be linked to categories, allowing StudyPilot to better reflect real course grading structures.

---

### 🏁 Final Grade Calculator

StudyPilot includes a calculator that estimates what score is needed on a final exam to reach a target grade.

It uses:

* Current grade
* Target grade
* Final exam weight

If the required score is above 100%, the app warns that the target may not be reachable without extra credit.

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* Axios
* CSS

### Backend

* Node.js
* Express
* CORS
* Nodemon

### Database

* SQLite
* better-sqlite3

---

## 🗂️ Project Structure

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
```

---

## ⚙️ How It Works

StudyPilot uses a React frontend, an Express backend, and a SQLite database.

The frontend sends API requests to the backend when users add, edit, or delete classes and assignments. The backend handles the request, updates the database, and returns the updated data to the frontend.

```text
React Frontend  →  Express Backend  →  SQLite Database
```

---

## 🧠 Database Design

StudyPilot uses three main tables:

### `classes`

Stores class information such as course name, course code, quarter, year, target grade, and notes.

### `assignments`

Stores assignment information such as title, due date, difficulty, status, score, and related class.

### `grade_categories`

Stores grading categories such as Homework, Projects, Quizzes, and Final.

Assignments are connected to classes using `class_id`, and assignments can also be connected to grade categories using `category_id`.

---

## 🌐 API Routes

### Classes

```http
GET /api/classes
POST /api/classes
DELETE /api/classes/:id
```

### Assignments

```http
GET /api/assignments
POST /api/assignments
PUT /api/assignments/:id
DELETE /api/assignments/:id
```

### Grade Categories

```http
GET /api/classes/:classId/categories
POST /api/classes/:classId/categories
DELETE /api/categories/:id
```

### Grade Calculations

```http
GET /api/classes/:classId/current-grade
GET /api/classes/:classId/grade-summary
```

---

## 📍 Current Progress

StudyPilot currently supports:

* Class creation and deletion
* Assignment creation, editing, and deletion
* Current and past assignment tracking
* Assignment filtering and sorting
* Grade category creation
* Assignment category selection
* Basic grade tracking
* Final grade calculator
* Dashboard summary cards
* Priority score calculation

---

## 🎓 Purpose

StudyPilot was created as a computer science project to combine academic planning with grade awareness.

The project demonstrates:

* Frontend development
* Backend API design
* Database relationships
* CRUD operations
* React state management
* Filtering and sorting
* Conditional rendering
* Grade calculations
* Priority scoring logic
