const { initDb, runAsync } = require('./database');

initDb().then(async () => {
  await runAsync('DELETE FROM audit_logs');
  await runAsync("DELETE FROM documents WHERE entity_type = 'asset'");
  await runAsync('DELETE FROM asset_returns');
  await runAsync('DELETE FROM return_requests');
  await runAsync('DELETE FROM maintenance');
  await runAsync('DELETE FROM asset_requests');
  await runAsync('DELETE FROM assignments');
  await runAsync('DELETE FROM assets');
  console.log('✅ All assets data cleared successfully.');
  console.log('   - assets: cleared');
  console.log('   - assignments: cleared');
  console.log('   - asset_requests: cleared');
  console.log('   - return_requests: cleared');
  console.log('   - asset_returns: cleared');
  console.log('   - maintenance: cleared');
  console.log('   - audit_logs: cleared');
  console.log('   - documents (asset): cleared');
  console.log('Employees, users, categories, companies, settings: PRESERVED');
  process.exit(0);
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
