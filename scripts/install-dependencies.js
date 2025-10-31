#!/usr/bin/env node
// Dependency installer and checker for LOTO App

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 LOTO App - Dependency Checker & Installer\n');

// Check if package.json exists
const packagePath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packagePath)) {
  console.error('❌ Error: package.json not found!');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Check Node.js version
console.log('📦 Checking Node.js version...');
const nodeVersion = process.version;
console.log(`   ✓ Node.js ${nodeVersion}`);

// Check npm
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`   ✓ npm ${npmVersion}`);
} catch (error) {
  console.error('   ❌ npm not found!');
  process.exit(1);
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
const needsInstall = !fs.existsSync(nodeModulesPath);

if (needsInstall) {
  console.log('\n📥 Installing dependencies...');
  console.log('   This may take a few minutes...\n');
  
  try {
    execSync('npm install', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('\n✅ Dependencies installed successfully!');
  } catch (error) {
    console.error('\n❌ Error installing dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('\n✓ node_modules exists');
  
  // Check for missing dependencies
  console.log('\n🔍 Checking for missing dependencies...');
  
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  
  const missingDeps = [];
  
  for (const dep in allDeps) {
    const depPath = path.join(nodeModulesPath, dep);
    if (!fs.existsSync(depPath)) {
      missingDeps.push(dep);
    }
  }
  
  if (missingDeps.length > 0) {
    console.log(`\n⚠️  Found ${missingDeps.length} missing dependencies:`);
    missingDeps.forEach(dep => console.log(`   - ${dep}`));
    
    console.log('\n📥 Installing missing dependencies...\n');
    try {
      execSync('npm install', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('\n✅ Missing dependencies installed!');
    } catch (error) {
      console.error('\n❌ Error installing dependencies:', error.message);
      process.exit(1);
    }
  } else {
    console.log('   ✓ All dependencies are installed!');
  }
}

// Create data directories
console.log('\n📁 Creating data directories...');
const dataDirs = [
  path.join(__dirname, '..', 'data'),
  path.join(__dirname, '..', 'data', 'pdfs'),
  path.join(__dirname, '..', 'data', 'plans'),
  path.join(__dirname, '..', 'data', 'personnel'),
  path.join(__dirname, '..', 'data', 'exports')
];

dataDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`   ✓ Created: ${path.relative(path.join(__dirname, '..'), dir)}`);
  } else {
    console.log(`   ✓ Exists: ${path.relative(path.join(__dirname, '..'), dir)}`);
  }
});

// Create config file if not exists
const configPath = path.join(__dirname, '..', 'data', 'config.json');
if (!fs.existsSync(configPath)) {
  const defaultConfig = {
    SUPABASE_URL: '',
    SUPABASE_KEY: '',
    SUPABASE_BUCKET: 'loto_pdfs',
    ACCESS_CODE: '010203'
  };
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  console.log('   ✓ Created: data/config.json');
}

console.log('\n✅ Setup complete!');
console.log('\n📋 Next steps:');
console.log('   1. Run: npm run electron-dev  (for development)');
console.log('   2. Run: npm run dist          (to build installer)\n');
