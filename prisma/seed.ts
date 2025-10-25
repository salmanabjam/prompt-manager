import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Type constants to replace enums
const PromptType = {
  TEXT: 'TEXT',
  CODE: 'CODE',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  CUSTOM: 'CUSTOM',
} as const;

const Language = {
  EN: 'EN',
  FA: 'FA',
} as const;

const ExecutionStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  TIMEOUT: 'TIMEOUT',
} as const;

async function main() {
  console.log('🌱 Seeding database...');

  // Create default tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'javascript' },
      update: {},
      create: {
        name: 'javascript',
        color: '#F7DF1E',
        icon: 'code',
      },
    }),
    prisma.tag.upsert({
      where: { name: 'react' },
      update: {},
      create: {
        name: 'react',
        color: '#61DAFB',
        icon: 'react',
      },
    }),
    prisma.tag.upsert({
      where: { name: 'typescript' },
      update: {},
      create: {
        name: 'typescript',
        color: '#3178C6',
        icon: 'code',
      },
    }),
    prisma.tag.upsert({
      where: { name: 'python' },
      update: {},
      create: {
        name: 'python',
        color: '#3776AB',
        icon: 'code',
      },
    }),
    prisma.tag.upsert({
      where: { name: 'ai' },
      update: {},
      create: {
        name: 'ai',
        color: '#8B5CF6',
        icon: 'brain',
      },
    }),
    prisma.tag.upsert({
      where: { name: 'image' },
      update: {},
      create: {
        name: 'image',
        color: '#EC4899',
        icon: 'image',
      },
    }),
  ]);

  console.log(`✅ Created ${tags.length} tags`);

  // Create sample prompts
  const samplePrompt1 = await prisma.prompt.create({
    data: {
      title: 'React Component Generator',
      description: 'Generate a reusable React component with TypeScript and props',
      content: `Create a React component called {{componentName}} that:
- Uses TypeScript for type safety
- Accepts props: {{propsList}}
- Implements {{functionality}}
- Includes proper JSDoc comments
- Exports as default`,
      type: PromptType.CODE,
      language: Language.EN,
      tags: {
        create: [
          { tag: { connect: { name: 'react' } } },
          { tag: { connect: { name: 'typescript' } } },
        ],
      },
    },
  });

  // Create first version
  await prisma.promptVersion.create({
    data: {
      promptId: samplePrompt1.id,
      versionNumber: 1,
      content: samplePrompt1.content,
      changeLog: 'Initial version',
    },
  });

  const samplePrompt2 = await prisma.prompt.create({
    data: {
      title: 'Image Generation Prompt',
      description: 'Professional photography prompt for AI image generation',
      content: `A professional photograph of {{subject}}, {{style}} style, 
shot on {{camera}}, {{lighting}} lighting, {{composition}} composition, 
high resolution, 8k, award-winning photography`,
      type: PromptType.IMAGE,
      language: Language.EN,
      tags: {
        create: [
          { tag: { connect: { name: 'ai' } } },
          { tag: { connect: { name: 'image' } } },
        ],
      },
    },
  });

  await prisma.promptVersion.create({
    data: {
      promptId: samplePrompt2.id,
      versionNumber: 1,
      content: samplePrompt2.content,
      changeLog: 'Initial version',
    },
  });

  const samplePrompt3 = await prisma.prompt.create({
    data: {
      title: 'نمونه پرامپت فارسی',
      description: 'یک پرامپت نمونه به زبان فارسی برای تست قابلیت RTL',
      content: `یک متن {{موضوع}} در مورد {{عنوان}} بنویس که:
- شامل {{تعداد}} پاراگراف باشد
- سبک نگارش {{سبک}} داشته باشد
- برای {{مخاطب}} مناسب باشد`,
      type: PromptType.TEXT,
      language: Language.FA,
      tags: {
        create: [],
      },
    },
  });

  await prisma.promptVersion.create({
    data: {
      promptId: samplePrompt3.id,
      versionNumber: 1,
      content: samplePrompt3.content,
      changeLog: 'نسخه اولیه',
    },
  });

  // Create sample execution
  await prisma.execution.create({
    data: {
      promptId: samplePrompt1.id,
      input: JSON.stringify({
        componentName: 'UserProfile',
        propsList: 'name, email, avatar',
        functionality: 'display user information',
      }),
      output: `export default function UserProfile({ name, email, avatar }) {
  return (
    <div className="user-profile">
      <img src={avatar} alt={name} />
      <h2>{name}</h2>
      <p>{email}</p>
    </div>
  );
}`,
      status: ExecutionStatus.SUCCESS,
      startedAt: new Date(),
      completedAt: new Date(),
      duration: 123,
    },
  });

  // Set default app settings
  await prisma.appSettings.upsert({
    where: { key: 'theme' },
    update: {},
    create: {
      key: 'theme',
      value: JSON.stringify({ mode: 'system' }),
    },
  });

  await prisma.appSettings.upsert({
    where: { key: 'language' },
    update: {},
    create: {
      key: 'language',
      value: JSON.stringify({ current: 'en' }),
    },
  });

  await prisma.appSettings.upsert({
    where: { key: 'density' },
    update: {},
    create: {
      key: 'density',
      value: JSON.stringify({ mode: 'comfortable' }),
    },
  });

  console.log('✅ Created sample prompts and settings');
  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
