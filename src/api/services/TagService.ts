import prisma from '../../lib/prisma';

export class TagService {
  async findAll() {
    return prisma.tag.findMany({
      include: {
        _count: {
          select: {
            prompts: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findById(id: string) {
    return prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            prompts: true,
          },
        },
      },
    });
  }

  async create(data: { name: string; color?: string; icon?: string }) {
    return prisma.tag.create({
      data: {
        ...data,
        color: data.color || this.generateColor(),
      },
    });
  }

  async update(id: string, data: { name?: string; color?: string; icon?: string }) {
    return prisma.tag.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await prisma.tag.delete({
      where: { id },
    });
  }

  private generateColor(): string {
    const colors = [
      '#6366F1',
      '#8B5CF6',
      '#EC4899',
      '#F59E0B',
      '#10B981',
      '#3B82F6',
      '#EF4444',
      '#14B8A6',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
