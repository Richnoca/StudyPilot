import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:5000/api";

function App() {
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [classGrades, setClassGrades] = useState({});
  const [categoriesByClass, setCategoriesByClass] = useState({});
  const [showDeveloperNotes, setShowDeveloperNotes] = useState(false);

  const [selectedClassFilter, setSelectedClassFilter] = useState("All");
  const [selectedPastClassFilter, setSelectedPastClassFilter] = useState("All");
  const [sortMode, setSortMode] = useState("priority");

  const [editingAssignmentId, setEditingAssignmentId] = useState(null);

  const [selectedCategoryClassId, setSelectedCategoryClassId] = useState("");
  const [selectedCalculatorClassId, setSelectedCalculatorClassId] = useState("");

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    weight: ""
  });

  const [calculatorForm, setCalculatorForm] = useState({
    targetGrade: 80,
    finalWeight: 20
  });

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
    category_id: "",
    title: "",
    due_date: "",
    estimated_hours: 1,
    difficulty: 1,
    status: "Not Started",
    score_received: "",
    points_possible: ""
  });

  const fetchAssignments = async () => {
    try {
      const response = await axios.get(`${API_URL}/assignments`);
      setAssignments(response.data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  const fetchAllCategories = async (classList) => {
    const categoryMap = {};

    for (const course of classList) {
      const response = await axios.get(
        `${API_URL}/classes/${course.id}/categories`
      );
      categoryMap[course.id] = response.data;
    }

    setCategoriesByClass(categoryMap);
  };

  const fetchClassGrades = async (classList) => {
    const grades = {};

    for (const course of classList) {
      const response = await axios.get(
        `${API_URL}/classes/${course.id}/current-grade`
      );
      grades[course.id] = response.data;
    }

    setClassGrades(grades);
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${API_URL}/classes`);
      const classList = response.data;

      setClasses(classList);

      if (classList.length === 0) {
        setAssignmentForm((prev) => ({
          ...prev,
          class_id: "",
          category_id: ""
        }));

        setSelectedCategoryClassId("");
        setSelectedCalculatorClassId("");
        setCategoriesByClass({});
        setClassGrades({});
        return;
      }

      const validClassIds = classList.map((course) => String(course.id));
      const firstClassId = String(classList[0].id);

      setAssignmentForm((prev) => {
        const currentClassIsValid = validClassIds.includes(String(prev.class_id));

        return {
          ...prev,
          class_id: currentClassIsValid ? prev.class_id : firstClassId,
          category_id: currentClassIsValid ? prev.category_id : ""
        };
      });

      const categoryClassIsValid = validClassIds.includes(
        String(selectedCategoryClassId)
      );

      if (!categoryClassIsValid) {
        setSelectedCategoryClassId(firstClassId);
      }

      const calculatorClassIsValid = validClassIds.includes(
        String(selectedCalculatorClassId)
      );

      if (!calculatorClassIsValid) {
        setSelectedCalculatorClassId(firstClassId);
        setCalculatorForm((prev) => ({
          ...prev,
          targetGrade: classList[0].target_grade || 80
        }));
      }

      await fetchAllCategories(classList);
      await fetchClassGrades(classList);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchAssignments();
  }, []);

  const handleClassChange = (event) => {
    const { name, value } = event.target;
    setClassForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAssignmentChange = (event) => {
    const { name, value } = event.target;

    setAssignmentForm((prev) => {
      if (name === "class_id") {
        return {
          ...prev,
          class_id: value,
          category_id: ""
        };
      }

      return {
        ...prev,
        [name]: value
      };
    });
  };

  const handleCategoryChange = (event) => {
    const { name, value } = event.target;
    setCategoryForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCalculatorChange = (event) => {
    const { name, value } = event.target;
    setCalculatorForm((prev) => ({ ...prev, [name]: value }));
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
      alert(error.response?.data?.error || "Error adding class.");
    }
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();

    if (!selectedCategoryClassId) {
      alert("Please add a class first.");
      return;
    }

    const validClass = classes.find(
      (course) => String(course.id) === String(selectedCategoryClassId)
    );

    if (!validClass) {
      alert("Please select a valid class before adding a category.");
      fetchClasses();
      return;
    }

    try {
      await axios.post(`${API_URL}/classes/${selectedCategoryClassId}/categories`, {
        name: categoryForm.name,
        weight: Number(categoryForm.weight)
      });

      setCategoryForm({
        name: "",
        weight: ""
      });

      fetchClasses();
      fetchAssignments();
    } catch (error) {
      console.error("Error adding category:", error);
      alert(error.response?.data?.error || "Error adding category.");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await axios.delete(`${API_URL}/categories/${categoryId}`);
      fetchClasses();
      fetchAssignments();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert(error.response?.data?.error || "Error deleting category.");
    }
  };

  const handleAssignmentSubmit = async (event) => {
    event.preventDefault();

    if (!assignmentForm.class_id) {
      alert("Please add a class before adding assignments.");
      return;
    }

    const validClass = classes.find(
      (course) => String(course.id) === String(assignmentForm.class_id)
    );

    if (!validClass) {
      alert("Please select a valid class before adding an assignment.");
      fetchClasses();
      return;
    }

    const validCategory =
      !assignmentForm.category_id ||
      selectedAssignmentCategories.some(
        (category) => String(category.id) === String(assignmentForm.category_id)
      );

    if (!validCategory) {
      alert("Please select a valid grade category or choose No category.");
      return;
    }

    const assignmentPayload = {
      ...assignmentForm,
      class_id: Number(assignmentForm.class_id),
      category_id: assignmentForm.category_id
        ? Number(assignmentForm.category_id)
        : null,
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
        category_id: "",
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
      alert(error.response?.data?.error || "Error saving assignment.");
    }
  };

  const handleDeleteClass = async (classId) => {
    try {
      await axios.delete(`${API_URL}/classes/${classId}`);
      fetchClasses();
      fetchAssignments();
    } catch (error) {
      console.error("Error deleting class:", error);
      alert(error.response?.data?.error || "Error deleting class.");
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    try {
      await axios.delete(`${API_URL}/assignments/${assignmentId}`);
      fetchAssignments();
      fetchClasses();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert(error.response?.data?.error || "Error deleting assignment.");
    }
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignmentId(assignment.id);

    setAssignmentForm({
      class_id: assignment.class_id,
      category_id: assignment.category_id || "",
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

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingAssignmentId(null);

    setAssignmentForm({
      class_id: classes.length > 0 ? classes[0].id : "",
      category_id: "",
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

  const allCurrentAssignments = assignments.filter(
    (assignment) => assignment.status !== "Graded"
  );

  const filteredAssignments =
    selectedClassFilter === "All"
      ? allCurrentAssignments
      : allCurrentAssignments.filter(
          (assignment) => String(assignment.class_id) === selectedClassFilter
        );

  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    if (sortMode === "priority") {
      return getPriorityScore(b) - getPriorityScore(a);
    }

    if (sortMode === "dueDate") {
      return (
        new Date(a.due_date || "9999-12-31") -
        new Date(b.due_date || "9999-12-31")
      );
    }

    if (sortMode === "class") {
      return a.course_code.localeCompare(b.course_code);
    }

    if (sortMode === "difficulty") {
      return Number(b.difficulty) - Number(a.difficulty);
    }

    if (sortMode === "hours") {
      return Number(b.estimated_hours) - Number(a.estimated_hours);
    }

    return 0;
  });

  const pastAssignments =
    selectedPastClassFilter === "All"
      ? assignments.filter((assignment) => assignment.status === "Graded")
      : assignments.filter(
          (assignment) =>
            assignment.status === "Graded" &&
            String(assignment.class_id) === selectedPastClassFilter
        );

  const highestPriorityAssignment = [...allCurrentAssignments].sort(
    (a, b) => getPriorityScore(b) - getPriorityScore(a)
  )[0];

  const dueThisWeek = allCurrentAssignments.filter((assignment) => {
    if (!assignment.due_date) return false;

    const today = new Date();
    const dueDate = new Date(assignment.due_date);
    const diffTime = dueDate - today;
    const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return daysUntilDue >= 0 && daysUntilDue <= 7;
  }).length;

  const validGrades = Object.values(classGrades)
    .map((grade) => grade.currentGrade)
    .filter((grade) => grade !== null && grade !== undefined);

  const averageGrade =
    validGrades.length > 0
      ? (
          validGrades.reduce((sum, grade) => sum + grade, 0) /
          validGrades.length
        ).toFixed(2)
      : "N/A";

  const selectedCalculatorGrade =
    selectedCalculatorClassId && classGrades[selectedCalculatorClassId]
      ? classGrades[selectedCalculatorClassId].currentGrade
      : null;

  const finalNeeded = (() => {
    const currentGrade = Number(selectedCalculatorGrade);
    const targetGrade = Number(calculatorForm.targetGrade);
    const finalWeight = Number(calculatorForm.finalWeight) / 100;

    if (
      selectedCalculatorGrade === null ||
      selectedCalculatorGrade === undefined ||
      !finalWeight ||
      finalWeight <= 0
    ) {
      return null;
    }

    const needed =
      (targetGrade - currentGrade * (1 - finalWeight)) / finalWeight;

    return Number(needed.toFixed(2));
  })();

  const selectedAssignmentCategories =
    categoriesByClass[assignmentForm.class_id] || [];

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-content">
          <div>
            <p className="eyebrow">StudyPilot</p>
            <h1>Quarter-Based Study & Grade Planner</h1>
            <p className="subtitle">
              Add your classes, track assignments, calculate grades, and decide
              what to work on next.
            </p>
          </div>

          <button
            className="developer-notes-btn"
            onClick={() => setShowDeveloperNotes(true)}
          >
            Developer Notes
          </button>
        </div>
      </header>

      {showDeveloperNotes && (
        <div className="notes-overlay">
          <div className="developer-notes-panel">
            <div className="developer-notes-header">
              <div>
                <p className="eyebrow modal-eyebrow">StudyPilot</p>
                <h2>Development Notes</h2>
              </div>

              <button
                className="close-notes-btn"
                onClick={() => setShowDeveloperNotes(false)}
              >
                ×
              </button>
            </div>

            <div className="notes-grid">
              <section className="notes-box notice-box">
                <h3>⚠️ Notice</h3>
                <p>
                  StudyPilot is currently under active development. Features,
                  calculations, and layout decisions may continue to change as
                  the project is improved. -Cody, App Developer.
                </p>
              </section>

              <section className="notes-box">
                <h3>Known Issues</h3>
                <ul>
                  <li>Weighted grade calculations are still being refined.</li>
                  <li>
                    Final grade calculator assumes the final is the remaining
                    weighted portion.
                  </li>
                  <li>
                    There is currently no login system, so data is stored
                    locally.
                  </li>
                </ul>
              </section>

              <section className="notes-box updates-box">
                <h3>Updates</h3>

                <div className="update-entry">
                  <h4>June 2026</h4>
                  <ul>
                    <li>Added dashboard summary cards.</li>
                    <li>Added grade categories for weighted grading.</li>
                    <li>Added final grade calculator.</li>
                    <li>
                      Added assignment sorting by priority, due date, class,
                      difficulty, and estimated hours.
                    </li>
                  </ul>
                </div>

                <div className="update-entry">
                  <h4>May 2026</h4>
                  <ul>
                    <li>Added class creation and deletion.</li>
                    <li>Added assignment creation, editing, and deletion.</li>
                    <li>Added current and past assignment sections.</li>
                    <li>Added assignment priority score system.</li>
                  </ul>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      <main className="layout">
        <section className="card dashboard-section">
          <div className="section-header">
            <h2>Dashboard</h2>
            <span>Overview</span>
          </div>

          <div className="dashboard-grid">
            <div className="dashboard-card">
              <p>Highest Priority</p>
              <h3>
                {highestPriorityAssignment
                  ? highestPriorityAssignment.title
                  : "No active assignments"}
              </h3>
              {highestPriorityAssignment && (
                <span>
                  {highestPriorityAssignment.course_code} • Score{" "}
                  {getPriorityScore(highestPriorityAssignment)}
                </span>
              )}
            </div>

            <div className="dashboard-card">
              <p>Due This Week</p>
              <h3>{dueThisWeek}</h3>
              <span>active assignments</span>
            </div>

            <div className="dashboard-card">
              <p>Average Current Grade</p>
              <h3>{averageGrade === "N/A" ? "N/A" : `${averageGrade}%`}</h3>
              <span>across graded classes</span>
            </div>

            <div className="dashboard-card">
              <p>Submitted</p>
              <h3>
                {
                  assignments.filter(
                    (assignment) => assignment.status === "Submitted"
                  ).length
                }
              </h3>
              <span>waiting for grades</span>
            </div>
          </div>
        </section>

        <section className="card add-class-section">
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

        <section className="card categories-section">
          <h2>Grade Categories</h2>

          <form onSubmit={handleCategorySubmit} className="class-form">
            <label>
              Class
              <select
                value={selectedCategoryClassId}
                onChange={(event) =>
                  setSelectedCategoryClassId(event.target.value)
                }
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

            <div className="row">
              <label>
                Category Name
                <input
                  type="text"
                  name="name"
                  placeholder="Homework"
                  value={categoryForm.name}
                  onChange={handleCategoryChange}
                  required
                />
              </label>

              <label>
                Weight %
                <input
                  type="number"
                  name="weight"
                  placeholder="25"
                  min="0"
                  max="100"
                  step="0.01"
                  value={categoryForm.weight}
                  onChange={handleCategoryChange}
                  required
                />
              </label>
            </div>

            <button type="submit">Add Category</button>
          </form>

          <div className="category-list">
            {(categoriesByClass[selectedCategoryClassId] || []).length === 0 ? (
              <p className="empty">No categories added for this class yet.</p>
            ) : (
              categoriesByClass[selectedCategoryClassId].map((category) => (
                <div key={category.id} className="category-chip">
                  <span>
                    {category.name}: {category.weight}%
                  </span>
                  <button onClick={() => handleDeleteCategory(category.id)}>
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="card calculator-section">
          <div className="section-header">
            <h2>Final Grade Calculator</h2>
            <span>Target</span>
          </div>

          <div className="class-form">
            <label>
              Class
              <select
                value={selectedCalculatorClassId}
                onChange={(event) => {
                  const selectedId = event.target.value;
                  const selectedClass = classes.find(
                    (course) => String(course.id) === String(selectedId)
                  );

                  setSelectedCalculatorClassId(selectedId);
                  setCalculatorForm((prev) => ({
                    ...prev,
                    targetGrade: selectedClass?.target_grade || prev.targetGrade
                  }));
                }}
              >
                {classes.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.course_code} - {course.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="row">
              <label>
                Target Grade %
                <input
                  type="number"
                  name="targetGrade"
                  min="0"
                  max="100"
                  step="0.01"
                  value={calculatorForm.targetGrade}
                  onChange={handleCalculatorChange}
                />
              </label>

              <label>
                Final Weight %
                <input
                  type="number"
                  name="finalWeight"
                  min="1"
                  max="100"
                  step="0.01"
                  value={calculatorForm.finalWeight}
                  onChange={handleCalculatorChange}
                />
              </label>
            </div>
          </div>

          <div className="calculator-result">
            <p>
              Current Grade:{" "}
              {selectedCalculatorGrade !== null &&
              selectedCalculatorGrade !== undefined
                ? `${selectedCalculatorGrade}%`
                : "N/A"}
            </p>

            {finalNeeded === null ? (
              <h3>Add a graded assignment first.</h3>
            ) : (
              <>
                <h3>You need {finalNeeded}% on the final.</h3>
                {finalNeeded > 100 && (
                  <p className="warning-text">
                    This target is not reachable without extra credit.
                  </p>
                )}
                {finalNeeded <= 0 && (
                  <p className="success-text">
                    You have already secured the target grade based on this
                    calculation.
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        <section className="card classes-section">
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
                        <p className="target">
                          Target Grade: {course.target_grade}%
                        </p>
                      )}
                    </div>

                    {classGrades[course.id]?.gradeType === "weighted" && (
                      <p className="grade-note">Using weighted categories</p>
                    )}

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

        <section className="card add-assignment-section">
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
              Grade Category
              <select
                name="category_id"
                value={assignmentForm.category_id}
                onChange={handleAssignmentChange}
              >
                <option value="">No category</option>
                {selectedAssignmentCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} - {category.weight}%
                  </option>
                ))}
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
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancelEdit}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </section>

        <section className="card assignments-section">
          <div className="section-header">
            <h2>Assignments</h2>
            <span>{allCurrentAssignments.length} active</span>
          </div>

          <div className="row">
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

            <label className="filter-label">
              Sort By
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value)}
              >
                <option value="priority">Priority</option>
                <option value="dueDate">Due Date</option>
                <option value="class">Class</option>
                <option value="difficulty">Difficulty</option>
                <option value="hours">Estimated Hours</option>
              </select>
            </label>
          </div>

          {sortedAssignments.length === 0 ? (
            <p className="empty">No active assignments.</p>
          ) : (
            <div className="assignment-list">
              {sortedAssignments.map((assignment) => (
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

                    {assignment.category_name && (
                      <p className="assignment-details">
                        Category: {assignment.category_name}{" "}
                        {assignment.category_weight
                          ? `(${assignment.category_weight}%)`
                          : ""}
                      </p>
                    )}

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
              onChange={(event) =>
                setSelectedPastClassFilter(event.target.value)
              }
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
                <article
                  key={assignment.id}
                  className="assignment-card past-card"
                >
                  <div>
                    <div className="assignment-topline">
                      <h3>{assignment.title}</h3>
                      <span className="graded-pill">Graded</span>
                    </div>

                    <p className="class-meta">
                      {assignment.course_code} • {assignment.class_name}
                    </p>

                    {assignment.category_name && (
                      <p className="assignment-details">
                        Category: {assignment.category_name}{" "}
                        {assignment.category_weight
                          ? `(${assignment.category_weight}%)`
                          : ""}
                      </p>
                    )}

                    <p className="assignment-details">
                      Score: {assignment.score_received}/
                      {assignment.points_possible}
                      {assignment.score_received !== null &&
                      assignment.points_possible !== null &&
                      assignment.points_possible > 0
                        ? ` • ${(
                            (assignment.score_received /
                              assignment.points_possible) *
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
