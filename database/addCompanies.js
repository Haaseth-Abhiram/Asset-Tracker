const { initDb, runAsync, allAsync } = require('./database');

async function main() {
  await initDb();
  await runAsync("INSERT OR REPLACE INTO companies (id, name, logo) VALUES ('C1', 'C1', '')");
  await runAsync("INSERT OR REPLACE INTO companies (id, name, logo) VALUES ('C2', 'C2', '')");
  await runAsync("INSERT OR REPLACE INTO companies (id, name, logo) VALUES ('C3', 'C3', '')");

  const companies = await allAsync('SELECT * FROM companies ORDER BY id ASC');
  console.log('✅ Successfully added companies in database:');
  console.table(companies);
  process.exit(0);
}

main().catch(err => {
  console.error('Error adding companies:', err);
  process.exit(1);
});
