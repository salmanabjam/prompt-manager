/**
 * Fix image paths in database
 * Convert Windows backslash paths to URL-compatible forward slash paths
 */

import prisma from '../lib/prisma.js';

async function fixImagePaths() {
  try {
    console.log('🔧 Starting image path fix...\n');

    // Get all images
    const images = await prisma.promptImage.findMany();
    
    console.log(`📊 Found ${images.length} images to check\n`);

    // Show all paths
    for (const image of images) {
      console.log(`Image ${image.id}:`);
      console.log(`  Path: "${image.path}"`);
      console.log(`  Thumbnail: "${image.thumbnail}"`);
      console.log(`  Has backslash in path: ${image.path.includes('\\')}`);
      console.log(`  Has backslash in thumbnail: ${image.thumbnail.includes('\\')}\n`);
    }

    let updatedCount = 0;

    for (const image of images) {
      // Check if paths contain backslashes
      const hasBackslashInPath = image.path.includes('\\');
      const hasBackslashInThumbnail = image.thumbnail.includes('\\');

      if (hasBackslashInPath || hasBackslashInThumbnail) {
        const newPath = image.path.replace(/\\/g, '/');
        const newThumbnail = image.thumbnail.replace(/\\/g, '/');

        console.log(`🔄 Updating image: ${image.id}`);
        console.log(`   Old path: ${image.path}`);
        console.log(`   New path: ${newPath}`);
        console.log(`   Old thumbnail: ${image.thumbnail}`);
        console.log(`   New thumbnail: ${newThumbnail}\n`);

        await prisma.promptImage.update({
          where: { id: image.id },
          data: {
            path: newPath,
            thumbnail: newThumbnail,
          },
        });

        updatedCount++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Total images: ${images.length}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Already correct: ${images.length - updatedCount}`);

  } catch (error) {
    console.error('❌ Error fixing image paths:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
fixImagePaths()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
