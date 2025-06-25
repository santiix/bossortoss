const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const axios = require('axios');

// 🔧 CONFIG
const csvPath = path.resolve(__dirname, 'src/assets/new_executive_targets.csv');
const apiUrl = 'http://localhost:8888/.netlify/functions/apollo-enrich';
const validRoles = ['CEO', 'CIO', 'CTO', 'COO', 'PRESIDENT'];

let rows = [];

// 🧠 Step 1: Read CSV and prepare unique company/role pairs
fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (row) => {
    const company = row.company || row.Company || row.company_name;
    const role = row.role || row.Role || row.title;

    if (!company || !role) return;

    const cleanRole = role.trim().toUpperCase();
    if (!validRoles.includes(cleanRole)) return;

    rows.push({
      company: company.trim(),
      role: cleanRole
    });
  })
  .on('end', async () => {
    console.log(`🔍 Found ${rows.length} valid company-role pairs`);

    // 🧼 Deduplicate company-role combos
    const seen = new Set();
    const uniqueCombos = rows.filter(({ company, role }) => {
      const key = `${company}_${role}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`🚀 Processing ${uniqueCombos.length} unique role matches...`);

    for (const { company, role } of uniqueCombos) {
      try {
        const res = await axios.post(apiUrl, { company, role }, {
          headers: { 'Content-Type': 'application/json' }
        });

        const body = res.data;

        if (body.skipped) {
          console.log(`⏭️ Skipped: ${role} at ${company}`);
        } else if (body.insertedCount > 0) {
          console.log(`✅ Inserted ${body.insertedCount}: ${role} at ${company}`);
        } else {
          console.log(`⚠️ Nothing inserted: ${role} at ${company}`);
        }

      } catch (err) {
        console.error(`❌ Error for ${role} at ${company}`);
        console.error(err.response?.data || err.message);
      }
    }

    console.log(`🏁 Done.`);
  });
