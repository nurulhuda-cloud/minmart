import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const projectRoot = process.cwd();
    const zipPath = join(projectRoot, 'minmart-project.zip');

    // Regenerate the zip file
    if (existsSync(zipPath)) {
      unlinkSync(zipPath);
    }

    execSync(
      `cd ${projectRoot} && zip -r minmart-project.zip src/ prisma/ public/ package.json tsconfig.json next.config.ts .env tailwind.config.ts postcss.config.mjs components.json -x "node_modules/*" ".next/*" "dev.log"`,
      { stdio: 'pipe' }
    );

    const fileBuffer = readFileSync(zipPath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="minmart-project.zip"',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to create download' }, { status: 500 });
  }
}
