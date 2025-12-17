#!/usr/bin/env node
import { readdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

async function getAllFiles(dir: string, fileList: string[] = []): Promise<string[]> {
  const files = await readdir(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = join(dir, file.name);
    if (file.isDirectory()) {
      await getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

async function main() {
  try {
    // Look for src/app directory in the current working directory
    const appDir = join(process.cwd(), 'src', 'app');
    
    console.log('🖊️  Pen - Minimal Test Version');
    console.log('================================\n');
    console.log(`Scanning: ${appDir}\n`);
    
    const files = await getAllFiles(appDir);
    
    if (files.length === 0) {
      console.log('❌ No files found in src/app/');
      return;
    }
    
    console.log(`✅ Found ${files.length} file(s):\n`);
    files.forEach((file, index) => {
      const relativePath = file.replace(process.cwd(), '.');
      console.log(`  ${index + 1}. ${relativePath}`);
    });
    
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error('❌ Error: src/app/ directory not found');
      console.error('   Make sure you run this command from your project root');
    } else {
      console.error('❌ Error:', (error as Error).message);
    }
    process.exit(1);
  }
}

main();
