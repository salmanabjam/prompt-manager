import prisma from '../../lib/prisma';

export class SettingsService {
  async getAll() {
    const settings = await prisma.appSettings.findMany();
    return settings.reduce((acc, setting) => {
      acc[setting.key] = JSON.parse(setting.value);
      return acc;
    }, {} as Record<string, any>);
  }

  async get(key: string) {
    const setting = await prisma.appSettings.findUnique({
      where: { key },
    });

    if (!setting) return null;

    return {
      key: setting.key,
      value: JSON.parse(setting.value),
    };
  }

  async set(key: string, value: any) {
    return prisma.appSettings.upsert({
      where: { key },
      update: {
        value: JSON.stringify(value),
      },
      create: {
        key,
        value: JSON.stringify(value),
      },
    });
  }
}
