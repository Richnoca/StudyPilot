import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:5000/api";

function App() {
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState("All");
  const [selectedPastClassFilter, setSelectedPastClassFilter] = useState("All");
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [classGrades, setClassGrades] = useState({});

  const [classForm, setClassForm] = useState({
    name: "",
    course_code: "",
    instructor: "",
    quarter: "Spring",
    year: new Date().getFullYear(),
    target_grade: 90,
    notes: ""
  });

  const [assignmentForm, setAssignmentForm] = useState({
    class_id: "",
    title: "",
    due_date: "",
    estimated_hours: 1,
    difficulty: 1,
    status: "Not Started",
    score_received: "",
    points_possible: ""
  });

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${API_URL}/classes`);
      setClasses(response.data);
      fetchClassGrades(response.data);

      if (response.data.length > 0 && !assignmentForm.class_id) {
        setAssignmentForm((prev) => ({
          ...prev,
          class_id: response.data[0].id
        }));
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await axios.get(`${API_URL}/assignments`);
      setAssignments(response.data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  const fetchClassGrades = async (classList) => {
  try {
    const grades = {};

    for (const course of classList) {
      const response = await axios.get(
        `${API_URL}/classes/${course.id}/current-grade`
      );

      grades[course.id] = response.data;
    }

    setClassGrades(grades);
  } catch (error) {
    console.error("Error fetching class grades:", error);
  }
};

  useEffect(() => {
    fetchClasses();
    fetchAssignments();
  }, []);

  const handleClassChange = (event) => {
    const { name, value } = event.target;

    setClassForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAssignmentChange = (event) => {
    const { name, value } = event.target;

    setAssignmentForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClassSubmit = async (event) => {
    event.preventDefault();

    try {
      await axios.post(`${API_URL}/classes`, {
        ...classForm,
        year: Number(classForm.year),
        target_grade: Number(classForm.target_grade)
      });

      setClassForm({
        name: "",
        course_code: "",
        instructor: "",
        quarter: "Spring",
        year: new Date().getFullYear(),
        target_grade: 90,
        notes: ""
      });

      fetchClasses();
    } catch (error) {
      console.error("Error adding class:", error);
    }
  };

const handleAssignmentSubmit = async (event) => {
  event.preventDefault();

  if (!assignmentForm.class_id) {
    alert("Please add a class before adding assignments.");
    return;
  }

  const assignmentPayload = {
    ...assignmentForm,
    class_id: Number(assignmentForm.class_id),
    estimated_hours: Number(assignmentForm.estimated_hours),
    difficulty: Number(assignmentForm.difficulty),
    score_received:
      assignmentForm.score_received === ""
        ? null
        : Number(assignmentForm.score_received),
    points_possible:
      assignmentForm.points_possible === ""
        ? null
        : Number(assignmentForm.points_possible)
  };

  try {
    if (editingAssignmentId) {
      await axios.put(
        `${API_URL}/assignments/${editingAssignmentId}`,
        assignmentPayload
      );
    } else {
      await axios.post(`${API_URL}/assignments`, assignmentPayload);
    }

    setAssignmentForm({
      class_id: classes.length > 0 ? classes[0].id : "",
      title: "",
      due_date: "",
      estimated_hours: 1,
      difficulty: 1,
      status: "Not Started",
      score_received: "",
      points_possible: ""
    });

    setEditingAssignmentId(null);
    fetchAssignments();
    fetchClasses();
  } catch (error) {
    console.error("Error saving assignment:", error);
  }
};

  const handleDeleteAssignment = async (assignmentId) => {
    try {
      await axios.delete(`${API_URL}/assignments/${assignmentId}`);
      fetchAssignments();
    } catch (error) {
      console.error("Error deleting assignment:", error);
    }
  };

  const handleEditAssignment = (assignment) => {
  setEditingAssignmentId(assignment.id);

  setAssignmentForm({
    class_id: assignment.class_id,
    title: assignment.title,
    due_date: assignment.due_date || "",
    estimated_hours: assignment.estimated_hours || 1,
    difficulty: assignment.difficulty || 1,
    status: assignment.status || "Not Started",
    score_received:
      assignment.score_received === null ? "" : assignment.score_received,
    points_possible:
      assignment.points_possible === null ? "" : assignment.points_possible
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
};

const handleCancelEdit = () => {
  setEditingAssignmentId(null);

  setAssignmentForm({
    class_id: classes.length > 0 ? classes[0].id : "",
    title: "",
    due_date: "",
    estimated_hours: 1,
    difficulty: 1,
    status: "Not Started",
    score_received: "",
    points_possible: ""
  });
};

  const getPriorityScore = (assignment) => {
    let score = 0;

    if (assignment.due_date) {
      const today = new Date();
      const dueDate = new Date(assignment.due_date);
      const diffTime = dueDate - today;
      const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysUntilDue <= 1) score += 40;
      else if (daysUntilDue <= 3) score += 30;
      else if (daysUntilDue <= 7) score += 20;
      else score += 10;
    }

    score += Number(assignment.difficulty || 1) * 8;
    score += Number(assignment.estimated_hours || 0) * 3;

    if (assignment.status === "Not Started") score += 20;
    if (assignment.status === "In Progress") score += 10;
    if (assignment.status === "Submitted" || assignment.status === "Graded") {
      score -= 40;
    }

    return Math.max(score, 0);
  };

  const filteredAssignments =
    selectedClassFilter === "All"
      ? assignments
      : assignments.filter(
          (assignment) => String(assignment.class_id) === selectedClassFilter
        );

  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    return getPriorityScore(b) - getPriorityScore(a);
  });

  const currentAssignments = sortedAssignments.filter(
    (assignment) => assignment.status !== "Graded"
  );

  const pastAssignments =
    selectedPastClassFilter === "All"
      ? assignments.filter((assignment) => assignment.status === "Graded")
      : assignments.filter(
          (assignment) =>
            assignment.status === "Graded" &&
            String(assignment.class_id) === selectedPastClassFilter
          );

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">StudyPilot</p>
          <h1>Quarter-Based Study & Grade Planner</h1>
          <p className="subtitle">
            Add your classes, track assignments, calculate grades, and decide
            what to work on next.
          </p>
        </div>
      </header>

      <main className="layout">
        <section className="card">
          <h2>Add Class</h2>

          <form onSubmit={handleClassSubmit} className="class-form">
            <label>
              Class Name
              <input
                type="text"
                name="name"
                placeholder="Computer Science Project"
                value={classForm.name}
                onChange={handleClassChange}
                required
              />
            </label>

            <label>
              Course Code
              <input
                type="text"
                name="course_code"
                placeholder="CS399"
                value={classForm.course_code}
                onChange={handleClassChange}
                required
              />
            </label>

            <label>
              Instructor
              <input
                type="text"
                name="instructor"
                placeholder="Professor name"
                value={classForm.instructor}
                onChange={handleClassChange}
              />
            </label>

            <div className="row">
              <label>
                Quarter
                <select
                  name="quarter"
                  value={classForm.quarter}
                  onChange={handleClassChange}
                  required
                >
                  <option>Fall</option>
                  <option>Winter</option>
                  <option>Spring</option>
                  <option>Summer</option>
                </select>
              </label>

              <label>
                Year
                <input
                  type="number"
                  name="year"
                  value={classForm.year}
                  onChange={handleClassChange}
                  required
                />
              </label>
            </div>

            <label>
              Target Grade %
              <input
                type="number"
                name="target_grade"
                value={classForm.target_grade}
                onChange={handleClassChange}
                min="0"
                max="100"
              />
            </label>

            <label>
              Notes
              <textarea
                name="notes"
                placeholder="Optional notes about this class"
                value={classForm.notes}
                onChange={handleClassChange}
              />
            </label>

            <button type="submit">Add Class</button>
          </form>
        </section>

        <section className="card">
          <div className="section-header">
            <h2>Your Classes</h2>
            <span>{classes.length} total</span>
          </div>

          {classes.length === 0 ? (
            <p className="empty">No classes added yet.</p>
          ) : (
            <div className="class-list">
              {classes.map((course) => (
                <article key={course.id} className="class-card">
                  <div>
                    <h3>{course.course_code}</h3>
                    <p className="class-name">{course.name}</p>

                    <p className="class-meta">
                      {course.quarter} {course.year}
                      {course.instructor ? ` • ${course.instructor}` : ""}
                    </p>

                    <div className="grade-row">
                      <p className="target">
                        Current Grade:{" "}
                        {classGrades[course.id]?.currentGrade !== null &&
                        classGrades[course.id]?.currentGrade !== undefined
                          ? `${classGrades[course.id].currentGrade}%`
                          : "N/A"}
                      </p>

                      {course.target_grade && (
                        <p className="target">Target Grade: {course.target_grade}%</p>
                      )}
                    </div>

                    {course.notes && <p className="notes">{course.notes}</p>}
                  </div>
                  
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteClass(course.id)}
                      >
                        Delete
                      </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2>{editingAssignmentId ? "Edit Assignment" : "Add Assignment"}</h2>

          <form onSubmit={handleAssignmentSubmit} className="class-form">
            <label>
              Class
              <select
                name="class_id"
                value={assignmentForm.class_id}
                onChange={handleAssignmentChange}
                required
              >
                {classes.length === 0 ? (
                  <option value="">Add a class first</option>
                ) : (
                  classes.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.course_code} - {course.name}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label>
              Assignment Title
              <input
                type="text"
                name="title"
                placeholder="Project 1"
                value={assignmentForm.title}
                onChange={handleAssignmentChange}
                required
              />
            </label>

            <label>
              Due Date
              <input
                type="date"
                name="due_date"
                value={assignmentForm.due_date}
                onChange={handleAssignmentChange}
              />
            </label>

            <div className="row">
              <label>
                Estimated Hours
                <input
                  type="number"
                  name="estimated_hours"
                  min="0"
                  step="0.5"
                  value={assignmentForm.estimated_hours}
                  onChange={handleAssignmentChange}
                />
              </label>

              <label>
                Difficulty
                <select
                  name="difficulty"
                  value={assignmentForm.difficulty}
                  onChange={handleAssignmentChange}
                >
                  <option value="1">1 - Easy</option>
                  <option value="2">2</option>
                  <option value="3">3 - Medium</option>
                  <option value="4">4</option>
                  <option value="5">5 - Hard</option>
                </select>
              </label>
            </div>

            <label>
              Status
              <select
                name="status"
                value={assignmentForm.status}
                onChange={handleAssignmentChange}
              >
                <option>Not Started</option>
                <option>In Progress</option>
                <option>Submitted</option>
                <option>Graded</option>
              </select>
            </label>

            <div className="row">
              <label>
                Score Received
                <input
                  type="number"
                  name="score_received"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                  value={assignmentForm.score_received}
                  onChange={handleAssignmentChange}
                />
              </label>

              <label>
                Points Possible
                <input
                  type="number"
                  name="points_possible"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                  value={assignmentForm.points_possible}
                  onChange={handleAssignmentChange}
                />
              </label>
            </div>

            <button type="submit">
              {editingAssignmentId ? "Save Assignment" : "Add Assignment"}
            </button>

            {editingAssignmentId && (
              <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
                Cancel Edit
              </button>
            )}
          </form>
        </section>

        <section className="card">
          <div className="section-header">
            <h2>Assignments</h2>
            <span>{assignments.length} total</span>
          </div>

          <label className="filter-label">
            Filter by Class
            <select
              value={selectedClassFilter}
              onChange={(event) => setSelectedClassFilter(event.target.value)}
            >
              <option value="All">All Classes</option>
              {classes.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_code}
                </option>
              ))}
            </select>
          </label>

          {currentAssignments.length === 0 ? (
            <p className="empty">No assignments added yet.</p>
          ) : (
            <div className="assignment-list">
              {currentAssignments.map((assignment) => (
                <article key={assignment.id} className="assignment-card">
                  <div>
                    <div className="assignment-topline">
                      <h3>{assignment.title}</h3>
                      <span className="priority-pill">
                        Priority: {getPriorityScore(assignment)}
                      </span>
                    </div>

                    <p className="class-meta">
                      {assignment.course_code} • {assignment.class_name}
                    </p>

                    <p className="assignment-details">
                      Due: {assignment.due_date || "No due date"} • Status:{" "}
                      {assignment.status} • Difficulty: {assignment.difficulty}/5
                    </p>

                    <p className="assignment-details">
                      Estimated Hours: {assignment.estimated_hours}
                      {assignment.score_received !== null &&
                      assignment.points_possible !== null
                        ? ` • Grade: ${assignment.score_received}/${assignment.points_possible}`
                        : ""}
                    </p>
                  </div>

                  <div className="assignment-actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleEditAssignment(assignment)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <section className="card past-section">
          <div className="section-header">
            <h2>Past Assignments</h2>
            <span>{pastAssignments.length} graded</span>
          </div>

          <label className="filter-label">
            Filter by Class
            <select
              value={selectedPastClassFilter}
              onChange={(event) => setSelectedPastClassFilter(event.target.value)}
            >
              <option value="All">All Classes</option>
              {classes.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_code}
                </option>
              ))}
            </select>
          </label>

          {pastAssignments.length === 0 ? (
            <p className="empty">No graded assignments yet.</p>
          ) : (
            <div className="assignment-list">
              {pastAssignments.map((assignment) => (
                <article key={assignment.id} className="assignment-card past-card">
                  <div>
                    <div className="assignment-topline">
                      <h3>{assignment.title}</h3>
                      <span className="graded-pill">Graded</span>
                    </div>

                    <p className="class-meta">
                      {assignment.course_code} • {assignment.class_name}
                    </p>

                    <p className="assignment-details">
                      Score: {assignment.score_received}/{assignment.points_possible}
                      {assignment.score_received !== null &&
                      assignment.points_possible !== null &&
                      assignment.points_possible > 0
                        ? ` • ${(
                            (assignment.score_received / assignment.points_possible) *
                            100
                          ).toFixed(2)}%`
                        : ""}
                    </p>

                    <p className="assignment-details">
                      Due Date: {assignment.due_date || "No due date"}
                    </p>
                  </div>

                  <div className="assignment-actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleEditAssignment(assignment)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;