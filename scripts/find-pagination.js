// Find all CRUD pages with pagination patterns
// This script will help us identify other pages that need to be updated

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const DASHBOARD_DIR = './src/app/(dashboard)';
const PAGINATION_PATTERN = /flex items-center gap-2 text-sm justify-end.*?Anterior.*?Página.*?Siguiente/s;

async function findFiles(dir, fileList = []) {
  const files = await readdir(dir, { withFileTypes: true });
  
  for (const file of files) {
    const path = join(dir, file.name);
    
    if (file.isDirectory()) {
      await findFiles(path, fileList);
    } else if (file.name.endsWith('.tsx') && !file.name.includes('pagination')) {
      fileList.push(path);
    }
  }
  
  return fileList;
}

async function searchFilesForPagination() {
  const files = await findFiles(DASHBOARD_DIR);
  const matches = [];
  
  for (const file of files) {
    try {
      const content = await readFile(file, 'utf8');
      if (PAGINATION_PATTERN.test(content)) {
        matches.push(file);
        console.log(`Found pagination in: ${file}`);
      }
    } catch (err) {
      console.error(`Error reading file ${file}:`, err);
    }
  }
  
  console.log(`\nFound ${matches.length} files with pagination patterns.`);
  return matches;
}

// Run the search
searchFilesForPagination().catch(console.error);