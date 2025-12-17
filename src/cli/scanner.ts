import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';

export interface Route {
  path: string;
  filePath: string;
}

async function getAllFiles(dir: string, baseDir: string, fileList: Route[] = []): Promise<Route[]> {
  try {
    const files = await readdir(dir, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = join(dir, file.name);
      
      if (file.isDirectory()) {
        await getAllFiles(filePath, baseDir, fileList);
      } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
        const relativePath = relative(baseDir, filePath);
        fileList.push({
          path: relativePath,
          filePath: filePath,
        });
      }
    }
  } catch (error) {
    // Ignore errors for directories that don't exist
  }
  
  return fileList;
}

export async function scanRoutes(): Promise<Route[]> {
  const appDir = join(process.cwd(), 'src', 'app');
  
  try {
    await stat(appDir);
  } catch (error) {
    throw new Error('src/app/ directory not found. Make sure you run this from your project root.');
  }
  
  const routes = await getAllFiles(appDir, appDir);
  
  if (routes.length === 0) {
    console.log('⚠️  No route files found in src/app/');
  }
  
  return routes;
}