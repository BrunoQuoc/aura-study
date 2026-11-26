import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const root=path.resolve(import.meta.dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("AURA-authored SGK/practice content goes directly to Student; external exams remain approval-gated",()=>{
 const student=read("student_learning_pipeline_v4.js");
 const edge=read("supabase/functions/aura-legacy-content-sync-v1/index.ts");
 const sql=read("supabase/migrations/20261126090500_aura_ai_auto_student_v7_20261126.sql");
 assert.match(student,/AI_AUTO_STUDENT/);
 assert.match(student,/student_auto_publish!==true/);
 assert.match(student,/student_auto_published!==true/);
 assert.match(student,/AURA tự biên soạn.*vào Student tự động/);
 assert.match(edge,/student_auto_publish!==true/);
 assert.match(edge,/student_auto_published!==true/);
 assert.match(edge,/manualContentKind/);
 assert.match(edge,/aura_legacy_content_admin_publish_v1/);
 assert.match(sql,/review_required_for_ai_content.*false/);
 assert.match(sql,/'preview_only',false/);
 assert.match(sql,/'student_auto_published',true/);
 assert.match(sql,/student_password_accounts_v6/);
});
test("Admin V3 clearly distinguishes automatic SGK/practice from manual exam/sample approval",()=>{
 const admin=read("admin_unified_v3.js");
 assert.match(admin,/tự đưa thẳng vào Student/);
 assert.match(admin,/Chỉ bộ đề và bài mẫu bên ngoài SGK cần anh duyệt/);
});
