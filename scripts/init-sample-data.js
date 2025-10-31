// Sample data initialization script for testing
// Run this only in development to populate database with test data

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/loto.db');

if (!fs.existsSync(dbPath)) {
  console.error('Database not found. Run the app first to create the database.');
  process.exit(1);
}

const db = new Database(dbPath);

console.log('Adding sample data to database...\n');

try {
  // Sample Breakers
  const sampleBreakers = [
    { name: 'Main Panel A', zone: 'Zone A', location: 'Building 1', state: 'On', lock_key: null, general_breaker: null },
    { name: 'Sub Panel A-1', zone: 'Zone A', location: 'Building 1', state: 'Off', lock_key: null, general_breaker: 'Main Panel A' },
    { name: 'Breaker A-1-01', zone: 'Zone A', location: 'Building 1', state: 'Closed', lock_key: 'K001', general_breaker: 'Sub Panel A-1' },
    { name: 'Breaker A-1-02', zone: 'Zone A', location: 'Building 1', state: 'Off', lock_key: null, general_breaker: 'Sub Panel A-1' },
    { name: 'Main Panel B', zone: 'Zone B', location: 'Building 2', state: 'On', lock_key: null, general_breaker: null },
    { name: 'Breaker B-01', zone: 'Zone B', location: 'Building 2', state: 'Closed', lock_key: 'K005', general_breaker: 'Main Panel B' },
  ];

  const breakerStmt = db.prepare(`
    INSERT INTO breakers (name, zone, location, state, lock_key, general_breaker)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  sampleBreakers.forEach(b => {
    breakerStmt.run(b.name, b.zone, b.location, b.state, b.lock_key, b.general_breaker);
  });
  console.log(`✓ Added ${sampleBreakers.length} sample breakers`);

  // Sample Locks
  const sampleLocks = [
    { key_number: 'K001', zone: 'Zone A', used: 1, assigned_to: 'Breaker A-1-01', remarks: 'Red lock' },
    { key_number: 'K002', zone: 'Zone A', used: 0, assigned_to: null, remarks: null },
    { key_number: 'K003', zone: 'Zone A', used: 0, assigned_to: null, remarks: null },
    { key_number: 'K004', zone: 'Zone B', used: 0, assigned_to: null, remarks: null },
    { key_number: 'K005', zone: 'Zone B', used: 1, assigned_to: 'Breaker B-01', remarks: 'Blue lock' },
    { key_number: 'K006', zone: 'Zone B', used: 0, assigned_to: null, remarks: null },
  ];

  const lockStmt = db.prepare(`
    INSERT INTO locks (key_number, zone, used, assigned_to, remarks)
    VALUES (?, ?, ?, ?, ?)
  `);

  sampleLocks.forEach(l => {
    lockStmt.run(l.key_number, l.zone, l.used, l.assigned_to, l.remarks);
  });
  console.log(`✓ Added ${sampleLocks.length} sample locks`);

  // Sample Personnel
  const samplePersonnel = [
    { name: 'John', lastname: 'Smith', id_card: 'EMP001', company: 'ABC Electric', habilitation: 'Electrical Safety Level 2', pdf_path: null },
    { name: 'Jane', lastname: 'Doe', id_card: 'EMP002', company: 'ABC Electric', habilitation: 'Electrical Safety Level 1', pdf_path: null },
    { name: 'Mike', lastname: 'Johnson', id_card: 'EMP003', company: 'XYZ Contractors', habilitation: 'Electrical Safety Level 3', pdf_path: null },
  ];

  const personnelStmt = db.prepare(`
    INSERT INTO personnel (name, lastname, id_card, company, habilitation, pdf_path)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  samplePersonnel.forEach(p => {
    personnelStmt.run(p.name, p.lastname, p.id_card, p.company, p.habilitation, p.pdf_path);
  });
  console.log(`✓ Added ${samplePersonnel.length} sample personnel`);

  // Sample History
  const sampleHistory = [
    { breaker_id: 3, action: 'Locked breaker A-1-01', user_mode: 'Editor', details: 'Maintenance work scheduled' },
    { breaker_id: 6, action: 'Locked breaker B-01', user_mode: 'Editor', details: 'Equipment upgrade' },
    { breaker_id: 1, action: 'Added new breaker', user_mode: 'Editor', details: null },
  ];

  const historyStmt = db.prepare(`
    INSERT INTO history (breaker_id, action, user_mode, details)
    VALUES (?, ?, ?, ?)
  `);

  sampleHistory.forEach(h => {
    historyStmt.run(h.breaker_id, h.action, h.user_mode, h.details);
  });
  console.log(`✓ Added ${sampleHistory.length} sample history entries`);

  console.log('\n✅ Sample data initialization complete!');
  console.log('\nYou can now:');
  console.log('  - View 6 breakers (2 locked)');
  console.log('  - Manage 6 locks (2 in use)');
  console.log('  - See 3 personnel records');
  console.log('  - Check recent activity history\n');

} catch (error) {
  console.error('❌ Error adding sample data:', error);
  process.exit(1);
} finally {
  db.close();
}
