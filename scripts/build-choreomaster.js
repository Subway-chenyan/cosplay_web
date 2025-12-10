#!/usr/bin/env node

/**
 * Build script for ChoreoMaster
 * This script builds ChoreoMaster and cleans up duplicate dist files
 */

import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

const projectRoot = process.cwd();
const choreoMasterPath = join(projectRoot, 'public/choreomaster/ChoreoMaster');
const oldDistPath = join(projectRoot, 'public/choreomaster/dist');
const newDistPath = join(choreoMasterPath, 'dist');

console.log('🚀 Building ChoreoMaster...');

try {
  // Clean up old dist directory if it exists
  if (existsSync(oldDistPath)) {
    console.log('🧹 Cleaning up old dist directory:', oldDistPath);
    rmSync(oldDistPath, { recursive: true, force: true });
  }

  // Clean up existing dist directory in ChoreoMaster
  if (existsSync(newDistPath)) {
    console.log('🧹 Cleaning up existing dist directory:', newDistPath);
    rmSync(newDistPath, { recursive: true, force: true });
  }

  // Build ChoreoMaster
  console.log('📦 Building ChoreoMaster project...');
  process.chdir(choreoMasterPath);

  // Install dependencies if node_modules doesn't exist
  if (!existsSync(join(choreoMasterPath, 'node_modules'))) {
    console.log('📥 Installing ChoreoMaster dependencies...');
    execSync('npm install', { stdio: 'inherit' });
  }

  // Build the project
  execSync('npm run build', { stdio: 'inherit' });

  // Change back to project root
  process.chdir(projectRoot);

  console.log('✅ ChoreoMaster built successfully!');
  console.log('📁 Dist location:', newDistPath);

} catch (error) {
  console.error('❌ Error building ChoreoMaster:', error.message);
  process.exit(1);
}