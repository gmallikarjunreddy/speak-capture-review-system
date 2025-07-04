
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function setupAdmin() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Insert or update admin user
    await pool.query(`
      INSERT INTO admin_users (username, password_hash) 
      VALUES ('admin', $1)
      ON CONFLICT (username) 
      DO UPDATE SET password_hash = $1
    `, [hashedPassword]);
    
    console.log('Admin user created/updated successfully');
    console.log('Username: admin');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting up admin:', error);
    process.exit(1);
  }
}

setupAdmin();
