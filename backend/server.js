const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// 🔌 เชื่อมต่อฐาน MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "child_malnutrition",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL database.");
    db.query("SET time_zone = '+07:00'");
  }
});

// ✅ GET: ดึงข้อมแพทย์จาก HN
app.get("/doctors/:hn", (req, res) => {
  const hn = req.params.hn;
  const query = `
    SELECT d.prefix_name_doctor, d.first_name_doctor, d.last_name_doctor
    FROM doctor d
    JOIN users u ON d.users_id = u.users_id
    WHERE u.hn_number = ?
  `;
  db.query(query, [hn], (err, results) => {
    if (err) return res.status(500).send("Database error");
    if (results.length > 0) {
      res.status(200).json(results[0]);
    } else {
      res.status(404).send("Doctor not found");
    }
  });
});

app.get("/patients", (req, res) => {
  const order = req.query.order === "asc" ? "ASC" : "DESC";

  const query = `
    SELECT 
      p.patient_id AS id,
      p.hn_number,
      p.prefix_name_child AS childPrefix,
      CONCAT(p.first_name_child, ' ', p.last_name_child) AS name,
      p.gender,
      p.age,
      p.birth_date,
      r.parent_id,
      pa.prefix_name_parent,
      CONCAT(pa.first_name_parent, ' ', pa.last_name_parent) AS parent,
      r.relationship
    FROM patient p
    LEFT JOIN relationship r ON p.patient_id = r.patient_id
    LEFT JOIN parent pa ON r.parent_id = pa.parent_id
    ORDER BY p.patient_id DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ SQL Error:", err);
      return res.status(500).json({ message: "DB Error" });
    }
    res.json(results);
  });
});

app.post("/patients", (req, res) => {
  const {
    hn_number,
    childPrefix,
    name,
    lastName,
    age,
    gender,
    birthDate,
    relationships // ✅ รับ array มา
  } = req.body;

  console.log("📥 Received payload:", req.body);

  const patientQuery = `
    INSERT INTO patient 
    (hn_number, prefix_name_child, first_name_child, last_name_child, birth_date, gender, age, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  db.query(
    patientQuery,
    [
      hn_number,
      childPrefix,
      name,
      lastName,
      birthDate,
      gender,
      age
    ],
    (err, results) => {
      if (err) return res.status(500).send(err);

      const newPatientId = results.insertId;

      if (!Array.isArray(relationships) || relationships.length === 0) {
        return res.status(400).json({ message: "❌ ต้องระบุข้อมูล relationships อย่างน้อยหนึ่งรายการ" });
      }

      const relQuery = `
        INSERT INTO relationship (patient_id, parent_id, relationship, created_at)
        VALUES ?
      `;

      // ✅ สร้าง array ของ [patient_id, parent_id, relationship, created_at]
      const relValues = relationships.map(rel => [
        newPatientId,
        rel.parent_id,
        rel.relationship,
        new Date()
      ]);

      db.query(relQuery, [relValues], (err2) => {
        if (err2) return res.status(500).send(err2);

        res.json({ id: newPatientId, message: "✅ เพิ่มข้อมูลเด็กพร้อมความสัมพันธ์ทั้งหมดสำเร็จ" });
      });
    }
  );
});



app.put("/patients/:id", (req, res) => {
  const {
    childPrefix,
    name,
    lastName,
    age,
    gender,
    birthDate,
    relationships // ✅ รับ array
  } = req.body;

  const patientQuery = `
    UPDATE patient
    SET prefix_name_child = ?, first_name_child = ?, last_name_child = ?,
        birth_date = ?, gender = ?, age = ?
    WHERE patient_id = ?
  `;

  db.query(patientQuery, [
    childPrefix,
    name,
    lastName,
    birthDate,
    gender,
    age,
    req.params.id
  ], (err) => {
    if (err) return res.status(500).send(err);

    // ✅ ลบ relationship เดิมก่อน
    const deleteQuery = `DELETE FROM relationship WHERE patient_id = ?`;
    db.query(deleteQuery, [req.params.id], (delErr) => {
      if (delErr) return res.status(500).send(delErr);

      if (!Array.isArray(relationships) || relationships.length === 0) {
        return res.status(400).json({ message: "❌ ต้องระบุความสัมพันธ์อย่างน้อย 1 รายการ" });
      }

      // ✅ เพิ่มความสัมพันธ์ใหม่ทั้งหมด
      const insertQuery = `
        INSERT INTO relationship (patient_id, parent_id, relationship, created_at)
        VALUES ?
      `;
      const values = relationships.map(r => [
        req.params.id,
        r.parent_id,
        r.relationship,
        new Date()
      ]);

      console.log("🧾 Inserting relationships: ", values);
      db.query(insertQuery, [values], (insErr) => {
        if (insErr) return res.status(500).send(insErr);

        res.json({ message: "✅ อัปเดตข้อมูลและความสัมพันธ์สำเร็จ" });
      });
    });
  });
});

// ✅ DELETE: ลบ patient + relationship
app.delete("/patients/:id", (req, res) => {
  const patientId = req.params.id;

  // ต้องลบ relationship ก่อน → เพราะมี foreign key
  const deleteRelationshipQuery = `
    DELETE FROM relationship WHERE patient_id = ?
  `;

  db.query(deleteRelationshipQuery, [patientId], (err) => {
    if (err) return res.status(500).send(err);

    // แล้วค่อยลบ patient
    const deletePatientQuery = `
      DELETE FROM patient WHERE patient_id = ?
    `;

    db.query(deletePatientQuery, [patientId], (err2) => {
      if (err2) return res.status(500).send(err2);

      res.json({ message: "🗑️ ลบข้อมูลเด็กสำเร็จ" });
    });
  });
});



// ✅ POST: เพิ่มประวัติใหม่
app.post("/patients/:id/records", (req, res) => {
  const { visit_date, note } = req.body;
  const query = `
    INSERT INTO patient_records (patient_id, visit_date, note)
    VALUES (?, ?, ?)
  `;
  db.query(query, [req.params.id, visit_date, note], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ id: result.insertId });
  });
});

// ✅ POST: Login ตรวจสอบ HN
app.post("/login", (req, res) => {
  const { identity } = req.body;

  const sql = `
    SELECT u.role, u.hn_number, 'accepted' AS status
    FROM users u
    LEFT JOIN parent p ON u.users_id = p.users_id
    WHERE u.hn_number = ? OR p.phone_number = ?

    UNION

    SELECT NULL AS role, r.hn_number, r.status
    FROM register r
    WHERE (r.hn_number = ? OR r.phone_number = ?) AND r.status IN ('pending', 'rejected')
  `;

  db.query(sql, [identity, identity, identity, identity], (err, results) => {
    if (err) {
      console.error("❌ SQL Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "ไม่พบข้อมูล HN หรือเบอร์โทร" });
    }

    const { role, hn_number, status } = results[0];

    if (status === "pending") {
      return res.status(403).json({
        message: "บัญชีของคุณยังไม่ได้รับการอนุมัติ\nกรุณาไปยืนยันตัวตนที่ศูนย์ติดต่อเพื่อยืนยันตัวตน",
        status: "pending" // ✅ เพิ่มตรงนี้ให้ React เช็คได้
      });
    }

    if (status === "rejected") {
      return res.status(403).json({
        message: "คำขอของคุณถูกปฏิเสธ กรุณาติดต่อเจ้าหน้าที่",
        status: "rejected"
      });
    }

    if (role === "admin") {
      return res.status(403).json({ message: "admin ต้องใช้ email/password เท่านั้น" });
    }

    return res.status(200).json({ role, hn_number, status });
  });
});




// ✅ GET: ข้อมูลผู้ปกครอง
app.get("/parents/:hn", (req, res) => {
  const hn = req.params.hn;
  const query = `
    SELECT first_name_parent, last_name_parent
    FROM parent
    WHERE hn_number = ?
  `;
  db.query(query, [hn], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: "Parent not found" });
    }
  });
});

app.get("/predictions", (req, res) => {
  const order = req.query.order === "asc" ? "ASC" : "DESC";
  const query = `
   SELECT 
      p.patient_id AS patientId,
      CONCAT(p.first_name_child, ' ', p.last_name_child) AS name,
      p.gender,
      p.age,
      pr.created_at AS date,
      pr.Status_personal AS status,
      mr.public_note,
      mr.review_by,
      mr.note_updated_at
    FROM prediction pr
    JOIN patient p ON p.patient_id = pr.patient_id
    LEFT JOIN medical_records mr 
      ON mr.patient_id = pr.patient_id AND mr.created_at = pr.created_at
    ORDER BY pr.created_at ${order}
  `;

  db.query(query, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});


// ✅ GET: ดึงข้อมูลแอดมินจาก HN
app.get("/admins/:hn", (req, res) => {
  const hn = req.params.hn;
  const query = `
    SELECT prefix_name_admin, first_name_admin, last_name_admin
    FROM admins a
    JOIN users u ON a.users_id = u.users_id
    WHERE u.hn_number = ?
  `;
  db.query(query, [hn], (err, results) => {
    if (err) return res.status(500).send("Database error");
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).send("Admin not found");
    }
  });
});

app.get("/find-parent-id", (req, res) => {
  const name = req.query.name;
  const [prefix, first, last] = name.split(" ");
  const query = `
    SELECT parent_id FROM parent
    WHERE prefix_name_parent = ? AND first_name_parent = ? AND last_name_parent = ?
  `;
  db.query(query, [prefix, first, last], (err, results) => {
    if (err) return res.status(500).json({ message: "DB Error" });
    if (results.length > 0) {
      res.json({ parent_id: results[0].parent_id });
    } else {
      res.status(404).json({ message: "Not found" });
    }
  });
});

app.post("/predictions/combined", (req, res) => {
  const data = req.body;
  const patientId = data.patient_id;

  if (!patientId) {
    return res.status(400).json({ error: "Missing patient_id" });
  }

  // 🔍 หาโค้ดนี้ใน server.js
  const weight = data.Weight;
  const height = data.Height;
  const visit_date = new Date().toISOString().split("T")[0];

  // ✅ เพิ่มตัวแปรใหม่
  const foodAllergy = data.Food_allergy || null;
  const drugAllergy = data.Drug_allergy || null;
  const disease = data.congenital_disease || null;

  // ❗ ลบจาก data ก่อนส่งเข้า prediction
  delete data.Weight;
  delete data.Height;
  delete data.Food_allergy;
  delete data.Drug_allergy;
  delete data.congenital_disease;


  // ✅ สร้าง query สำหรับ medical_records
  const insertMedical = `
  INSERT INTO medical_records (patient_id, visit_date, weight, height, Food_allergy, Drug_allergy, congenital_disease, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
`;

  db.query(insertMedical, [patientId, visit_date, weight, height, foodAllergy, drugAllergy, disease], (err1) => {
    if (err1) {
      console.error("❌ Insert medical_records failed:", err1);
      return res.status(500).json({ error: "Insert medical_records failed" });
    }


    // ✅ เตรียมข้อมูลสำหรับ prediction
    const fields = Object.keys(data)
      .filter((key) => key !== "patient_id")
      .map((key) => `\`${key}\``)
      .join(", ");

    const numericFields = new Set([
      "Breastfeeding_Count_DayandNight",
      "Infant_Formula_Intake_Count_Yesterday",
      "Received_Animal_Milk_Count",
    ]);

    const booleanTrueFalseFields = new Set([
      "Sanitary_Disposal",
      "Child_wash_hand_before_or_after_eating_food",
      "Child_wash_hand_before_or_after_visiting_the_toilet",
      "Still_Breastfeeding",
    ]);

    const normalizeValueForDB = (key, value) => {
      // ✅ ถ้าเป็น field ที่ต้องเป็น True/False string
      if (booleanTrueFalseFields.has(key)) {
        if (typeof value === "boolean") return value ? "True" : "False";
        if (value === 1 || value === "1" || value === "yes" || value === "true") return "True";
        return "False";
      }

      // ✅ ถ้าเป็น field ที่ต้องเป็นตัวเลข
      if (numericFields.has(key)) {
        return value === "" || value === null || value === undefined ? 0 : Number(value);
      }

      // ✅ default: yes/no สำหรับ checkbox ทั่วไป
      if (typeof value === "boolean") {
        return value ? "yes" : "no";
      }

      if (value === 1) return "yes";
      if (value === 0) return "no";

      return value;
    };

    const values = Object.keys(data)
      .filter((key) => key !== "patient_id")
      .map((key) => mysql.escape(normalizeValueForDB(key, data[key])))
      .join(", ");

    const query = `
      INSERT INTO prediction (patient_id, ${fields}, created_at)
      VALUES (${mysql.escape(patientId)}, ${values}, NOW())
    `;

    db.query(query, (err2, result) => {
      if (err2) {
        console.error("❌ Insert prediction failed:", err2);
        return res.status(500).json({ error: "Insert prediction failed" });
      }

      res.status(201).json({ message: "✅ บันทึกข้อมูลสำเร็จ", prediction_id: result.insertId });
    });
  });
});



// ✅ GET: ข้อมูล users จาก hnNumber
app.get("/users/:hn", (req, res) => {
  const hn = req.params.hn;
  const query = `
    SELECT * FROM users
    WHERE hn_number = ?
  `;
  db.query(query, [hn], (err, results) => {
    if (err) return res.status(500).send("Database error");
    if (results.length > 0) {
      res.status(200).json(results[0]);
    } else {
      res.status(404).send("User not found");
    }
  });
});

app.get("/find-patient-id", (req, res) => {
  const hn = req.query.hn;
  const query = `SELECT patient_id FROM patient WHERE hn_number = ?`;
  db.query(query, [hn], (err, results) => {
    if (err) return res.status(500).json({ message: "DB Error" });
    if (results.length > 0) {
      res.json({ patient_id: results[0].patient_id });
    } else {
      res.status(404).json({ message: "Not found" });
    }
  });
});

app.post("/medical-records", (req, res) => {
  const { patient_id, height, weight, visit_date } = req.body;

  const query = `
    INSERT INTO medical_records (patient_id, visit_date, height, weight, created_at)
    VALUES (?, ?, ?, ?, NOW())
  `;

  db.query(query, [patient_id, visit_date, height, weight], (err, result) => {
    if (err) {
      console.error("SQL Error:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.status(200).json({ message: "✅ บันทึกสำเร็จ", id: result.insertId });
  });
});

app.get("/children-by-parent/:hn", (req, res) => {
  const hn = req.params.hn;
  const query = `
    SELECT 
      p.patient_id,
      p.hn_number AS hn,
      p.prefix_name_child,
      p.first_name_child,
      p.last_name_child
    FROM parent pa
    JOIN relationship r ON pa.parent_id = r.parent_id
    JOIN patient p ON r.patient_id = p.patient_id
    WHERE pa.hn_number = ?
  `;
  db.query(query, [hn], (err, results) => {
    if (err) {
      console.error("❌ SQL Error:", err);
      return res.status(500).json({ message: "DB error" });
    }
    res.json(results);
  });
});

app.get("/patients/:id/records", (req, res) => {
  const id = req.params.id;
  const query = `
    SELECT 
      m.weight,
      m.height,
      m.Food_allergy AS Food_allergy,
      m.Drug_allergy AS drug_allergy,
      m.congenital_disease,
      pt.hn_number,
      p.Status_personal AS status
    FROM medical_records m
    JOIN (
      SELECT * FROM prediction
      WHERE patient_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    ) p ON m.patient_id = p.patient_id
    JOIN patient pt ON pt.patient_id = m.patient_id
    WHERE m.patient_id = ?
    ORDER BY m.created_at DESC
    LIMIT 1;
  `;

  db.query(query, [id, id], (err, results) => {
    if (err) {
      console.error("❌ Error fetching medical record:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: "No records found" });
    }
  });
});


// ✅ GET: รายชื่อผู้ปกครองทั้งหมด (สำหรับ dropdown)
app.get("/parents", (req, res) => {
  const query = `
    SELECT parent_id AS id, prefix_name_parent AS prefix, first_name_parent AS name, last_name_parent AS lastName
    FROM parent
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: "DB Error" });
    res.json(results);
  });
});

// ✅ GET: รายชื่อผู้ปกครองพร้อมเด็กในความดูแล
app.get("/parents-with-children", (req, res) => {
  const query = `
    SELECT 
      pa.parent_id,
      pa.hn_number,
      pa.prefix_name_parent,
      pa.first_name_parent,
      pa.last_name_parent,
      CONCAT(pa.prefix_name_parent, ' ', pa.first_name_parent, ' ', pa.last_name_parent) AS parent_name,
      pa.houseNo,
      pa.moo,
      pa.alley,
      pa.street,
      pa.subDistrict,
      pa.district,
      pa.province,
      pa.postalCode,
      pa.phone_number,
      GROUP_CONCAT(CONCAT(p.prefix_name_child, ' ', p.first_name_child, ' ', p.last_name_child) SEPARATOR ', ') AS children,
      GROUP_CONCAT(r.relationship SEPARATOR ', ') AS relationships
    FROM parent pa
    LEFT JOIN relationship r ON pa.parent_id = r.parent_id
    LEFT JOIN patient p ON r.patient_id = p.patient_id
    GROUP BY pa.parent_id
    ORDER BY pa.parent_id;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ SQL Error:", err);
      return res.status(500).json({ message: "DB Error" });
    }
    res.json(results);
  });
});

app.post("/parents", (req, res) => {
  const {
    hn_number,
    prefix,
    name,
    lastName,
    phone,
    houseNo,
    moo,
    alley,
    street,
    subDistrict,
    district,
    province,
    postalCode
  } = req.body;


  // ✅ เพิ่มข้อมูลเข้า users ก่อน เพื่อให้ users_id ถูกเชื่อม
  const insertUser = `
    INSERT INTO users (hn_number, phone_number, role, created_at)
    VALUES (?, ?, 'parent', NOW())
  `;

  db.query(insertUser, [hn_number, phone], (err1, result1) => {
    if (err1) {
      console.error("❌ Insert users error:", err1);
      return res.status(500).json({ message: "เกิดข้อผิดพลาดขณะเพิ่ม users" });
    }

    const users_id = result1.insertId;

    // ✅ เพิ่มข้อมูลผู้ปกครอง
    const insertParent = `
      INSERT INTO parent (
        users_id, prefix_name_parent, first_name_parent, last_name_parent,
        hn_number, phone_number, houseNo, moo, alley, street,
        subDistrict, district, province, postalCode, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    db.query(
      insertParent,
      [
        users_id, prefix, name, lastName,
        hn_number, phone, houseNo, moo, alley, street,
        subDistrict, district, province, postalCode
      ],
      (err2, result2) => {
        if (err2) {
          console.error("❌ Insert parent error:", err2);
          return res.status(500).json({ message: "เกิดข้อผิดพลาดขณะเพิ่ม parent" });
        }

        res.status(201).json({
          message: "✅ เพิ่มข้อมูลผู้ปกครองสำเร็จ",
          parent_id: result2.insertId,
          hn_number
        });
      }
    );
  });
});

// ✅ DELETE: ลบข้อมูลผู้ปกครอง
app.delete("/parents/:id", (req, res) => {
  const parentId = req.params.id;

  // 1. ลบความสัมพันธ์กับเด็กก่อน (ถ้ามี)
  const deleteRelationshipQuery = `DELETE FROM relationship WHERE parent_id = ?`;

  db.query(deleteRelationshipQuery, [parentId], (err1) => {
    if (err1) {
      console.error("❌ Delete relationship error:", err1);
      return res.status(500).json({ message: "ลบความสัมพันธ์ล้มเหลว" });
    }

    // 2. ลบข้อมูลจากตาราง parent
    const deleteParentQuery = `DELETE FROM parent WHERE parent_id = ?`;

    db.query(deleteParentQuery, [parentId], (err2) => {
      if (err2) {
        console.error("❌ Delete parent error:", err2);
        return res.status(500).json({ message: "ลบข้อมูลผู้ปกครองล้มเหลว" });
      }

      // 3. (เลือกได้) ลบจาก users ด้วยถ้าต้องการ
      const deleteUserQuery = `
        DELETE FROM users
        WHERE users_id NOT IN (SELECT users_id FROM parent)
          AND role = 'parent'
      `;
      db.query(deleteUserQuery, (err3) => {
        if (err3) {
          console.warn("⚠️ ไม่สามารถลบ users ที่เกี่ยวข้องได้:", err3);
        }

        res.json({ message: "✅ ลบข้อมูลผู้ปกครองสำเร็จ" });
      });
    });
  });
});

// ✅ ดึงรายชื่อหมอทั้งหมด (เพิ่ม work_day)
app.get("/doctors", (req, res) => {
  const sql = `
    SELECT 
      d.doctor_id,
      d.prefix_name_doctor,
      d.first_name_doctor,
      d.last_name_doctor,
      d.work_day,
      d.work_time,
      d.specialist,
      u.hn_number,
      u.phone_number
    FROM doctor d
    JOIN users u ON d.users_id = u.users_id
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).send("❌ ดึงข้อมูลผิดพลาด");
    res.json(results);
  });
});



app.post("/doctors", (req, res) => {
  const {
    hn_number,
    prefix,
    firstName,
    lastName,
    phone,
    specialist,
    workTime,
    workDay
  } = req.body;

  // 1️⃣ เพิ่มข้อมูล users ก่อน
  const insertUserQuery = `
    INSERT INTO users (hn_number, phone_number, role, created_at)
    VALUES (?, ?, 'doctor', NOW())
  `;

  db.query(insertUserQuery, [hn_number, phone], (err1, result1) => {
    if (err1) {
      console.error("❌ Insert users error:", err1);
      return res.status(500).json({ message: "เพิ่ม users ไม่สำเร็จ" });
    }

    const users_id = result1.insertId;

    // 2️⃣ เพิ่มข้อมูล doctor
    const insertDoctorQuery = `
      INSERT INTO doctor (
        users_id,
        hn_number, -- ✅ เพิ่มตรงนี้
        prefix_name_doctor,
        first_name_doctor,
        last_name_doctor,
        specialist,
        work_time,
        work_day,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    db.query(insertDoctorQuery, [users_id, hn_number, prefix, firstName, lastName, specialist, workTime, workDay], (err2, result2) => {
      if (err2) {
        console.error("❌ Insert doctor error:", err2);
        return res.status(500).json({ message: "เพิ่ม doctor ไม่สำเร็จ" });
      }

      res.status(201).json({ message: "✅ เพิ่มหมอสำเร็จ", doctor_id: result2.insertId });
    });
  });
});


app.delete("/doctors/:id", (req, res) => {
  const doctorId = req.params.id;

  // 🔍 หา users_id จาก doctor ก่อน
  const findUserQuery = `SELECT users_id FROM doctor WHERE doctor_id = ?`;

  db.query(findUserQuery, [doctorId], (err1, result1) => {
    if (err1 || result1.length === 0) {
      console.error("❌ Doctor ไม่พบหรือ error:", err1);
      return res.status(404).json({ message: "ไม่พบ doctor" });
    }

    const users_id = result1[0].users_id;

    // 1️⃣ ลบ doctor
    const deleteDoctorQuery = `DELETE FROM doctor WHERE doctor_id = ?`;
    db.query(deleteDoctorQuery, [doctorId], (err2) => {
      if (err2) {
        console.error("❌ ลบ doctor ล้มเหลว:", err2);
        return res.status(500).json({ message: "ลบ doctor ล้มเหลว" });
      }

      // 2️⃣ ลบ users ที่เกี่ยวข้อง
      const deleteUserQuery = `
        DELETE FROM users
        WHERE users_id = ? AND role = 'doctor'
      `;
      db.query(deleteUserQuery, [users_id], (err3) => {
        if (err3) {
          console.warn("⚠️ ลบ users ไม่ได้:", err3);
          return res.status(500).json({ message: "ลบ users ไม่สำเร็จ" });
        }

        res.json({ message: "🗑️ ลบหมอสำเร็จ" });
      });
    });
  });
});

// ✅ PUT: แก้ไขข้อมูลหมอ
app.put("/doctors/:id", (req, res) => {
  const doctorId = req.params.id;
  const {
    hn_number,
    prefix,
    firstName,
    lastName,
    phone,
    specialist,
    workDay,
    workTime
  } = req.body;

  const updateDoctorQuery = `
    UPDATE doctor d
    JOIN users u ON d.users_id = u.users_id
    SET 
      d.prefix_name_doctor = ?,
      d.first_name_doctor = ?,
      d.last_name_doctor = ?,
      d.specialist = ?,
      d.work_day = ?,
      d.work_time = ?,
      u.hn_number = ?,
      u.phone_number = ?
    WHERE d.doctor_id = ?
  `;

  db.query(
    updateDoctorQuery,
    [prefix, firstName, lastName, specialist, workDay, workTime, hn_number, phone, doctorId],
    (err, result) => {
      if (err) {
        console.error("❌ Update doctor error:", err);
        return res.status(500).json({ message: "แก้ไขข้อมูล doctor ไม่สำเร็จ" });
      }

      res.json({ message: "✅ แก้ไขข้อมูลหมอสำเร็จ" });
    }
  );
});


// ✅ GET: ประวัติน้ำหนักและส่วนสูงย้อนหลัง
// ✅ GET: ประวัติการตรวจย้อนหลังทั้งหมด (ใช้กับกราฟ)
app.get("/patients/:id/records/history", (req, res) => {
  const patientId = req.params.id;
  const query = `
    SELECT created_at, weight, height
    FROM medical_records
    WHERE patient_id = ?
    ORDER BY created_at ASC
  `;
  db.query(query, [patientId], (err, results) => {
    if (err) {
      console.error("❌ Error fetching patient history:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.status(200).json(results);
  });
});



// ✅ GET: created_at ทั้งหมดของผู้ป่วย (ไว้ใช้ใน dropdown)
app.get("/patients/:id/records/timestamps", (req, res) => {
  const patientId = req.params.id;
  const query = `
    SELECT DISTINCT m.created_at
    FROM medical_records m
    JOIN prediction p ON m.patient_id = p.patient_id AND m.created_at = p.created_at
    WHERE m.patient_id = ?
    ORDER BY m.created_at DESC
  `;

  db.query(query, [patientId], (err, results) => {
    if (err) {
      console.error("❌ Error fetching timestamps:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const timestamps = results.map(row => row.created_at);
    res.status(200).json(timestamps);
  });
});



// ✅ PUT: บันทึก note ทั้งสองแบบ
app.put("/patients/:id/records/public_note", (req, res) => {
  const { id } = req.params;
  const { created_at, public_note, review_by } = req.body;

  // 🔒 ตรวจสอบว่าข้อมูลจำเป็นถูกส่งมาครบ
  if (!created_at || !public_note || !review_by) {
    return res.status(400).json({ message: "❌ Missing required fields" });
  }

  const updateQuery = `
    UPDATE medical_records
    SET public_note = ?, review_by = ?,note_updated_at = NOW()
    WHERE patient_id = ? AND created_at = ?
  `;

  db.query(updateQuery, [public_note, review_by, id, created_at], (err, result) => {
    if (err) {
      console.error("❌ Update failed:", err);
      return res.status(500).json({ message: "Update failed", error: err });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "❌ Record not found or not updated" });
    }

    res.json({ message: "✅ Updated successfully" });
  });
});


app.put("/patients/:id/records/private_note", (req, res) => {
  const { id } = req.params;
  const { created_at, private_note, } = req.body; // ✅ เพิ่ม review_by

  const sql = `
    UPDATE medical_records
    SET 
      private_note = ?, 
      note_updated_at = NOW()
    WHERE patient_id = ? AND created_at = ?
  `;

  // ✅ ส่งค่าครบทั้ง 4 ตัว
  db.query(sql, [private_note, id, created_at], (err, result) => {
    if (err) {
      console.error("❌ Error updating notes:", err);
      return res.status(500).json({ message: "Error updating notes" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "❌ Record not found" });
    }

    res.json({ message: "✅ Notes updated successfully" });
  });
});

app.put("/parents/:id", (req, res) => {
  const parentId = req.params.id;
  const {
    hn_number,
    prefix,
    name,
    lastName,
    phone,
    houseNo,
    moo,
    alley,
    street,
    subDistrict,
    district,
    province,
    postalCode,
  } = req.body;

  const updateParentQuery = `
    UPDATE parent p
    JOIN users u ON p.users_id = u.users_id
    SET
      p.prefix_name_parent = ?,
      p.first_name_parent = ?,
      p.last_name_parent = ?,
      p.hn_number = ?,
      p.phone_number = ?,
      p.houseNo = ?,
      p.moo = ?,
      p.alley = ?,
      p.street = ?,
      p.subDistrict = ?,
      p.district = ?,
      p.province = ?,
      p.postalCode = ?,
      u.hn_number = ?,
      u.phone_number = ?
    WHERE p.parent_id = ?
  `;

  db.query(updateParentQuery, [
    prefix,
    name,
    lastName,
    hn_number,
    phone,
    houseNo,
    moo,
    alley,
    street,
    subDistrict,
    district,
    province,
    postalCode,
    hn_number,
    phone,
    parentId
  ], (err, result) => {
    if (err) {
      console.error("❌ Update parent error:", err);
      return res.status(500).json({ message: "อัปเดตข้อมูลผู้ปกครองไม่สำเร็จ" });
    }

    res.status(200).json({ message: "✅ อัปเดตข้อมูลผู้ปกครองสำเร็จ" });
  });
});



app.get("/patients/:id", (req, res) => {
  const patientId = req.params.id;

  const query = `
    SELECT 
      p.patient_id AS id,
      p.hn_number,
      p.prefix_name_child,
      p.first_name_child,
      p.last_name_child,
      p.birth_date,
      p.age,
      p.gender,
      pa.parent_id,
      pa.prefix_name_parent,
      pa.first_name_parent,
      pa.last_name_parent,
      r.relationship
    FROM patient p
    LEFT JOIN relationship r ON p.patient_id = r.patient_id
    LEFT JOIN parent pa ON r.parent_id = pa.parent_id
    WHERE p.patient_id = ?
  `;

  db.query(query, [patientId], (err, results) => {
    if (err) {
      console.error("❌ SQL Error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลเด็ก" });
    }

    const result = results[0];
    result.full_name = `${result.prefix_name_child} ${result.first_name_child} ${result.last_name_child}`;
    result.parent_name = `${result.prefix_name_parent} ${result.first_name_parent} ${result.last_name_parent}`;

    res.json(result);
  });
});

app.get("/users-hn", (req, res) => {
  const email = req.query.email;
  const query = `SELECT hn_number FROM users WHERE hn_number = ?`; // email = hn สำหรับ admin

  db.query(query, [email], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    }
    res.json(results[0]);
  });
});


app.post("/login-auth", (req, res) => {
  const { identity, password } = req.body;

  const query = `
    SELECT a.*, u.hn_number 
    FROM admins a
    JOIN users u ON a.users_id = u.users_id
    WHERE (a.email = ? OR a.username = ?) AND a.password = ?
  `;

  db.query(query, [identity, identity, password], (err, results) => {
    if (err) {
      console.error("❌ SQL error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "ไม่พบผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const admin = results[0];
    return res.status(200).json({
      token: "mocked-admin-token", // ✅ แทนด้วย token จริงถ้ามี
      role: "admin",
      hn_number: admin.hn_number
    });
  });
});

// ✅ GET: ดึง private_note และ public_note จาก medical_records
app.get("/patients/:id/records/notes", (req, res) => {
  const { id } = req.params;
  const { created_at } = req.query;

  if (!created_at) {
    return res.status(400).json({ message: "กรุณาระบุ created_at" });
  }

  const sql = `
    SELECT private_note, public_note 
    FROM medical_records 
    WHERE patient_id = ? AND created_at = ?
  `;

  db.query(sql, [id, created_at], (err, results) => {
    if (err) {
      console.error("❌ Error fetching notes:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ message: "ไม่พบข้อมูล" });
    }
  });
});

app.post("/register", (req, res) => {
  const {
    prefix,
    firstName,
    lastName,
    hn_number,
    phone,
    houseNo,
    moo,
    alley,
    street,
    subDistrict,
    district,
    province,
    postalCode
  } = req.body;

  const query = `
    INSERT INTO register (
      prefix_name_parent, first_name_parent, last_name_parent,
      hn_number, phone_number, houseNo, moo, alley, street,
      subDistrict, district, province, postalCode,
      status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
  `;

  db.query(query, [
    prefix, firstName, lastName,
    hn_number, phone, houseNo, moo, alley, street,
    subDistrict, district, province, postalCode
  ], (err, result) => {
    if (err) {
      console.error("❌ Error inserting register:", err);
      return res.status(500).json({ message: "เกิดข้อผิดพลาดในการสมัคร" });
    }
    return res.status(201).json({ message: "✅ ส่งคำขอสมัครสำเร็จ รอการอนุมัติจากเจ้าหน้าที่" });
  });
});

app.get("/registers", (req, res) => {
  const status = req.query.status || 'pending';
  const query = `SELECT * FROM register WHERE status = ? ORDER BY register_id DESC`;
  db.query(query, [status], (err, result) => {
    if (err) return res.status(500).json({ message: "โหลดไม่สำเร็จ" });
    res.json(result);
  });
});

app.get("/last-parent-hn", async (req, res) => {
  const query = `
    SELECT MAX(hn_number_num) AS max_hn FROM (
      SELECT CAST(NULLIF(hn_number, '') AS UNSIGNED) AS hn_number_num FROM users
      UNION ALL
      SELECT CAST(NULLIF(hn_number, '') AS UNSIGNED) FROM patient
      UNION ALL
      SELECT CAST(NULLIF(hn_number, '') AS UNSIGNED) FROM parent 
      UNION ALL
      SELECT CAST(NULLIF(hn_number, '') AS UNSIGNED) FROM register
    ) AS all_hn
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("❌ ไม่สามารถดึง hn_number ได้:", err);
      return res.status(500).json({ message: "ดึง hn_number ไม่สำเร็จ" });
    }

    const maxHN = results[0]?.max_hn || 0;
    const newHN = (maxHN + 1).toString().padStart(5, "0"); // ปรับ padding ตามต้องการ เช่น 6 ถ้าใช้ '01012'
    res.json({ last_hn: newHN });
  });
});

app.post("/approve-register/:id", (req, res) => {
  const registerId = req.params.id;
  const adminId = req.body?.admin_id || 1;

  console.log("🔔 รับคำขออนุมัติ register_id:", registerId, "โดย admin_id:", adminId);

  const getQuery = `SELECT * FROM register WHERE register_id = ?`;
  db.query(getQuery, [registerId], (err, results) => {
    if (err) {
      console.error("❌ ดึงข้อมูล register ผิดพลาด:", err);
      return res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้สมัคร" });
    }

    const reg = results[0];

    if (reg.status !== "pending") {
      return res.status(400).json({ message: "คำขอนี้ได้รับการอนุมัติหรือปฏิเสธไปแล้ว" });
    }

    const cleanedPhone = reg.phone_number.replace(/-/g, "");

    // ✅ ตรวจสอบว่า hn_number มีอยู่แล้วหรือไม่
    const checkHNQuery = `
      SELECT hn_number FROM parent WHERE hn_number = ?
      UNION
      SELECT hn_number FROM users WHERE hn_number = ?
    `;

    db.query(checkHNQuery, [reg.hn_number, reg.hn_number], (err, hnResults) => {
      if (err) {
        console.error("❌ Error checking duplicate HN:", err);
        return res.status(500).json({ message: "เกิดข้อผิดพลาดในการตรวจสอบ HN ซ้ำ" });
      }

      if (hnResults.length > 0) {
        return res.status(400).json({ message: `HN "${reg.hn_number}" มีอยู่ในระบบแล้ว` });
      }

      // ✅ ดำเนินการ insert parent
      const insertParent = `
        INSERT INTO parent (
          hn_number, prefix_name_parent, first_name_parent, last_name_parent,
          phone_number, houseNo, moo, alley, street,
          subDistrict, district, province, postalCode,
          users_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const parentData = [
        reg.hn_number,
        reg.prefix_name_parent,
        reg.first_name_parent,
        reg.last_name_parent,
        cleanedPhone,
        reg.houseNo,
        reg.moo,
        reg.alley,
        reg.street,
        reg.subDistrict,
        reg.district,
        reg.province,
        reg.postalCode,
        null // users_id
        // NOW() ไม่ต้องใส่ เพราะใช้ใน query
      ];

      db.query(insertParent, parentData, (err, parentResult) => {
        if (err) {
          console.error("❌ Error inserting parent:", err);
          return res.status(500).json({ message: "ไม่สามารถสร้างข้อมูลผู้ปกครอง" });
        }

        const insertUser = `
          INSERT INTO users (hn_number, phone_number, role, created_at)
          VALUES (?, ?, 'parent', NOW())
        `;

        db.query(insertUser, [reg.hn_number, cleanedPhone], (err, userResult) => {
          if (err) {
            console.error("❌ Error creating user:", err);
            return res.status(500).json({ message: "ไม่สามารถสร้างบัญชีผู้ใช้" });
          }

          const updateParent = `
            UPDATE parent
            SET users_id = ?
            WHERE hn_number = ?
          `;

          db.query(updateParent, [userResult.insertId, reg.hn_number], (err) => {
            if (err) {
              console.error("❌ Error updating parent.users_id:", err);
              return res.status(500).json({ message: "อัปเดต users_id ล้มเหลว" });
            }

            const updateRegister = `
              UPDATE register 
              SET status = 'accepted', 
                  reviewed_by_admin_id = ?, 
                  reviewed_at = NOW()
              WHERE register_id = ?
            `;

            db.query(updateRegister, [adminId, registerId], (err) => {
              if (err) {
                console.error("❌ Error updating register status:", err);
                return res.status(500).json({ message: "อัปเดตสถานะล้มเหลว" });
              }

              return res.status(200).json({
                message: "✅ อนุมัติสำเร็จ",
                phone: cleanedPhone,
                hn_number: reg.hn_number
              });
            });
          });
        });
      });
    });
  });
});


app.put("/reject-register/:id", (req, res) => {
  const registerId = req.params.id;
  const adminId = req.body?.admin_id || 1; // หากต้องการบันทึกว่าแอดมินคนไหน reject

  const query = `
    UPDATE register 
    SET status = 'rejected',
        reviewed_by_admin_id = ?,
        reviewed_at = NOW()
    WHERE register_id = ?
  `;

  db.query(query, [adminId, registerId], (err, result) => {
    if (err) {
      console.error("❌ Error rejecting register:", err);
      return res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "ไม่พบคำขอสมัครที่ระบุ" });
    }

    res.status(200).json({ message: "✅ ปฏิเสธคำขอสมัครแล้ว" });
  });
});


// POST /check-duplicate
app.post("/check-duplicate", (req, res) => {
  const { hn_number, phone } = req.body;
  const query = `
    SELECT * FROM register
    WHERE hn_number = ? OR phone = ?
  `;
  db.query(query, [hn_number, phone], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length > 0) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  });
});


// ✅ Start server
app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});





