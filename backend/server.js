const express = require("express");
const cors = require("cors");
const db = require("./database");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "StudyPilot backend is running" });
});

// --------------------
// CLASSES ROUTES
// --------------------

app.get("/api/classes", (req, res) => {
  const classes = db
    .prepare("SELECT * FROM classes ORDER BY year DESC, quarter, course_code")
    .all();

  res.json(classes);
});

app.post("/api/classes", (req, res) => {
  const {
    name,
    course_code,
    instructor,
    quarter,
    year,
    target_grade,
    notes
  } = req.body;

  if (!name || !course_code || !quarter || !year) {
    return res.status(400).json({
      error: "Class name, course code, quarter, and year are required."
    });
  }

  const stmt = db.prepare(`
    INSERT INTO classes 
    (name, course_code, instructor, quarter, year, target_grade, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    name,
    course_code,
    instructor || "",
    quarter,
    year,
    target_grade || null,
    notes || ""
  );

  const newClass = db
    .prepare("SELECT * FROM classes WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(newClass);
});

app.delete("/api/classes/:id", (req, res) => {
  const { id } = req.params;

  const result = db.prepare("DELETE FROM classes WHERE id = ?").run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Class not found." });
  }

  res.json({ message: "Class deleted successfully." });
});

// --------------------
// GRADE CATEGORY ROUTES
// --------------------

app.get("/api/classes/:classId/categories", (req, res) => {
  const { classId } = req.params;

  const categories = db
    .prepare("SELECT * FROM grade_categories WHERE class_id = ? ORDER BY name")
    .all(classId);

  res.json(categories);
});

app.post("/api/classes/:classId/categories", (req, res) => {
  const { classId } = req.params;
  const { name, weight } = req.body;

  if (!name || weight === undefined) {
    return res.status(400).json({
      error: "Category name and weight are required."
    });
  }

  const stmt = db.prepare(`
    INSERT INTO grade_categories (class_id, name, weight)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(classId, name, Number(weight));

  const newCategory = db
    .prepare("SELECT * FROM grade_categories WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(newCategory);
});

app.delete("/api/categories/:id", (req, res) => {
  const { id } = req.params;

  const result = db.prepare("DELETE FROM grade_categories WHERE id = ?").run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Category not found." });
  }

  res.json({ message: "Category deleted successfully." });
});

// --------------------
// ASSIGNMENT ROUTES
// --------------------

app.get("/api/assignments", (req, res) => {
  const assignments = db
    .prepare(`
      SELECT 
        assignments.*,
        classes.course_code,
        classes.name AS class_name,
        grade_categories.name AS category_name,
        grade_categories.weight AS category_weight
      FROM assignments
      JOIN classes ON assignments.class_id = classes.id
      LEFT JOIN grade_categories ON assignments.category_id = grade_categories.id
      ORDER BY due_date ASC
    `)
    .all();

  res.json(assignments);
});

app.post("/api/assignments", (req, res) => {
  const {
    class_id,
    category_id,
    title,
    due_date,
    estimated_hours,
    difficulty,
    status,
    score_received,
    points_possible
  } = req.body;

  if (!class_id || !title) {
    return res.status(400).json({
      error: "Class and assignment title are required."
    });
  }

  const stmt = db.prepare(`
    INSERT INTO assignments
    (
      class_id,
      category_id,
      title,
      due_date,
      estimated_hours,
      difficulty,
      status,
      score_received,
      points_possible
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    class_id,
    category_id || null,
    title,
    due_date || null,
    estimated_hours || 0,
    difficulty || 1,
    status || "Not Started",
    score_received === "" ? null : score_received,
    points_possible === "" ? null : points_possible
  );

  const newAssignment = db
    .prepare("SELECT * FROM assignments WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(newAssignment);
});

app.put("/api/assignments/:id", (req, res) => {
  const { id } = req.params;

  const {
    class_id,
    category_id,
    title,
    due_date,
    estimated_hours,
    difficulty,
    status,
    score_received,
    points_possible
  } = req.body;

  if (!class_id || !title) {
    return res.status(400).json({
      error: "Class and assignment title are required."
    });
  }

  const stmt = db.prepare(`
    UPDATE assignments
    SET
      class_id = ?,
      category_id = ?,
      title = ?,
      due_date = ?,
      estimated_hours = ?,
      difficulty = ?,
      status = ?,
      score_received = ?,
      points_possible = ?
    WHERE id = ?
  `);

  const result = stmt.run(
    class_id,
    category_id || null,
    title,
    due_date || null,
    estimated_hours || 0,
    difficulty || 1,
    status || "Not Started",
    score_received === "" ? null : score_received,
    points_possible === "" ? null : points_possible,
    id
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: "Assignment not found." });
  }

  const updatedAssignment = db
    .prepare("SELECT * FROM assignments WHERE id = ?")
    .get(id);

  res.json(updatedAssignment);
});

app.delete("/api/assignments/:id", (req, res) => {
  const { id } = req.params;

  const result = db.prepare("DELETE FROM assignments WHERE id = ?").run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Assignment not found." });
  }

  res.json({ message: "Assignment deleted successfully." });
});

// --------------------
// GRADE CALCULATION ROUTES
// --------------------

app.get("/api/classes/:classId/current-grade", (req, res) => {
  const { classId } = req.params;

  const categories = db
    .prepare("SELECT * FROM grade_categories WHERE class_id = ?")
    .all(classId);

  const gradedAssignments = db
    .prepare(`
      SELECT * FROM assignments
      WHERE class_id = ?
      AND status = 'Graded'
      AND score_received IS NOT NULL
      AND points_possible IS NOT NULL
      AND points_possible > 0
    `)
    .all(classId);

  if (gradedAssignments.length === 0) {
    return res.json({
      currentGrade: null,
      earnedPoints: 0,
      possiblePoints: 0,
      gradeType: "none"
    });
  }

  if (categories.length > 0) {
    let weightedTotal = 0;
    let usedWeight = 0;

    categories.forEach((category) => {
      const categoryAssignments = gradedAssignments.filter(
        (assignment) => assignment.category_id === category.id
      );

      if (categoryAssignments.length > 0) {
        const earned = categoryAssignments.reduce(
          (sum, assignment) => sum + assignment.score_received,
          0
        );

        const possible = categoryAssignments.reduce(
          (sum, assignment) => sum + assignment.points_possible,
          0
        );

        const average = (earned / possible) * 100;

        weightedTotal += average * category.weight;
        usedWeight += category.weight;
      }
    });

    if (usedWeight > 0) {
      return res.json({
        currentGrade: Number((weightedTotal / usedWeight).toFixed(2)),
        earnedPoints: null,
        possiblePoints: null,
        usedWeight,
        gradeType: "weighted"
      });
    }
  }

  const earnedPoints = gradedAssignments.reduce(
    (sum, assignment) => sum + assignment.score_received,
    0
  );

  const possiblePoints = gradedAssignments.reduce(
    (sum, assignment) => sum + assignment.points_possible,
    0
  );

  const currentGrade = (earnedPoints / possiblePoints) * 100;

  res.json({
    currentGrade: Number(currentGrade.toFixed(2)),
    earnedPoints,
    possiblePoints,
    gradeType: "points"
  });
});

app.get("/api/classes/:classId/grade-summary", (req, res) => {
  const { classId } = req.params;

  const categories = db
    .prepare("SELECT * FROM grade_categories WHERE class_id = ?")
    .all(classId);

  const assignments = db
    .prepare(`
      SELECT * FROM assignments
      WHERE class_id = ?
      AND status = 'Graded'
      AND score_received IS NOT NULL
      AND points_possible IS NOT NULL
      AND points_possible > 0
    `)
    .all(classId);

  let weightedTotal = 0;
  let usedWeight = 0;

  const categorySummaries = categories.map((category) => {
    const categoryAssignments = assignments.filter(
      (assignment) => assignment.category_id === category.id
    );

    if (categoryAssignments.length === 0) {
      return {
        category: category.name,
        weight: category.weight,
        average: null
      };
    }

    const earned = categoryAssignments.reduce(
      (sum, assignment) => sum + assignment.score_received,
      0
    );

    const possible = categoryAssignments.reduce(
      (sum, assignment) => sum + assignment.points_possible,
      0
    );

    const average = (earned / possible) * 100;

    weightedTotal += average * category.weight;
    usedWeight += category.weight;

    return {
      category: category.name,
      weight: category.weight,
      average: Number(average.toFixed(2))
    };
  });

  const weightedGrade =
    usedWeight > 0 ? Number((weightedTotal / usedWeight).toFixed(2)) : null;

  res.json({
    weightedGrade,
    usedWeight,
    categorySummaries
  });
});

app.listen(PORT, () => {
  console.log(`StudyPilot backend running on http://localhost:${PORT}`);
});