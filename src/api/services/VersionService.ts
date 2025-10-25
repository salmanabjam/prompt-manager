import prisma from '../../lib/prisma';

export class VersionService {
  async findByPromptId(promptId: string) {
    return prisma.promptVersion.findMany({
      where: { promptId },
      orderBy: { versionNumber: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.promptVersion.findUnique({
      where: { id },
      include: {
        prompt: true,
      },
    });
  }

  async create(data: {
    promptId: string;
    content: string;
    changeLog?: string;
  }) {
    const latestVersion = await prisma.promptVersion.findFirst({
      where: { promptId: data.promptId },
      orderBy: { versionNumber: 'desc' },
    });

    return prisma.promptVersion.create({
      data: {
        promptId: data.promptId,
        versionNumber: (latestVersion?.versionNumber || 0) + 1,
        content: data.content,
        changeLog: data.changeLog || 'No description',
      },
    });
  }

  async restore(id: string) {
    const version = await this.findById(id);
    if (!version) return null;

    // Update prompt with this version's content
    await prisma.prompt.update({
      where: { id: version.promptId },
      data: {
        content: version.content,
      },
    });

    // Create a new version marking the restoration
    await this.create({
      promptId: version.promptId,
      content: version.content,
      changeLog: `Restored from version ${version.versionNumber}`,
    });

    return { success: true };
  }
}
