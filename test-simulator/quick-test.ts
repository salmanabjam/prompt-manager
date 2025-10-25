/**
 * Quick Test Runner - سریع‌ترین راه برای تست سیستم
 * فقط تست‌های اصلی و مهم را اجرا می‌کند
 */

import { TestSimulator } from './core/TestSimulator';

async function quickTest() {
  console.log('\n🚀 Quick Test - بررسی سریع سیستم\n');
  
  const baseUrl = 'http://localhost:3456';
  const sim = new TestSimulator({ logLevel: 'info' });

  sim.suite({
    id: 'quick',
    name: 'Quick Health Check',
    description: 'بررسی سریع عملکرد اصلی سیستم',
    tests: [
      {
        id: 'q1',
        name: 'API Health Check',
        description: 'بررسی دسترسی به API',
        category: 'api',
        run: async (ctx) => {
          const res = await fetch(`${baseUrl}/api/prompts`);
          ctx.assert.equal(res.status, 200, 'API باید در دسترس باشد');
          const json = await res.json();
          ctx.assert.hasProperty(json, 'data', 'پاسخ باید data داشته باشد');
          ctx.log.info(`✅ API کار می‌کند - ${json.data.length} prompt موجود`);
        },
      },
      {
        id: 'q2',
        name: 'Create Prompt Test',
        description: 'تست ایجاد prompt جدید',
        category: 'integration',
        run: async (ctx) => {
          const res = await fetch(`${baseUrl}/api/prompts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Quick Test ' + Date.now(),
              content: 'Test content',
              type: 'text',
            }),
          });
          
          ctx.assert.equal(res.status, 201, 'باید prompt ایجاد شود');
          const prompt = await res.json();
          ctx.assert.isDefined(prompt.id, 'باید ID داشته باشد');
          ctx.log.info(`✅ Prompt ایجاد شد: ${prompt.id}`);
        },
      },
      {
        id: 'q3',
        name: 'Tags API Test',
        description: 'تست لیست تگ‌ها',
        category: 'api',
        run: async (ctx) => {
          const res = await fetch(`${baseUrl}/api/tags`);
          ctx.assert.equal(res.status, 200, 'API تگ‌ها باید کار کند');
          const tags = await res.json();
          ctx.assert.isTrue(Array.isArray(tags), 'باید آرایه باشد');
          ctx.log.info(`✅ ${tags.length} تگ موجود است`);
        },
      },
      {
        id: 'q4',
        name: 'Performance Check',
        description: 'بررسی سرعت پاسخ',
        category: 'performance',
        run: async (ctx) => {
          const start = Date.now();
          await fetch(`${baseUrl}/api/prompts`);
          const duration = Date.now() - start;
          
          ctx.assert.isTrue(duration < 500, 'باید زیر 500ms باشد');
          ctx.log.info(`✅ زمان پاسخ: ${duration}ms`);
        },
      },
    ],
  });

  const results = await sim.run();
  const failed = results.filter(r => r.status === 'failed').length;
  
  if (failed === 0) {
    console.log('\n🎉 همه تست‌ها موفق بودند! سیستم کاملاً سالم است.\n');
  } else {
    console.log(`\n⚠️  ${failed} تست ناموفق - لطفاً بررسی کنید.\n`);
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

quickTest().catch(console.error);
