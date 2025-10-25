# 🧪 Prompt Management System - Test Simulator

شبیه‌ساز تست کامل برای سیستم مدیریت Prompt - قابل توسعه و خودکار

## 📋 ویژگی‌ها

✅ **تست خودکار کامل** - تمام API endpoints و Database operations  
✅ **Assertion Framework** - 20+ helper برای validation  
✅ **Logging پیشرفته** - 5 سطح log (silent → verbose)  
✅ **Performance Metrics** - اندازه‌گیری زمان و منابع  
✅ **Report Generation** - گزارش JSON/HTML/CSV  
✅ **قابل توسعه** - افزودن suite و test جدید آسان  
✅ **Concurrent Testing** - تست همزمان برای stress test  
✅ **Error Recovery** - مدیریت خطا و retry logic  

## 🚀 نصب و راه‌اندازی

```bash
# نصب dependencies
cd test-simulator
npm install

# اجرای تمام تست‌ها
npm test

# اجرای تست‌های خاص
npm run test:api          # فقط API tests
npm run test:integration  # فقط Integration tests

# با خروجی مفصل
npm run test:verbose
npm run test:debug
```

## 📊 Test Suites

### 1️⃣ API Test Suite (10 tests)
تست کامل تمام endpoint های Fastify:
- ✅ GET /api/prompts - لیست تمام prompts
- ✅ POST /api/prompts - ایجاد prompt جدید
- ✅ POST /api/prompts - Validation errors
- ✅ GET /api/tags - لیست تگ‌ها
- ✅ POST /api/tags - ایجاد تگ جدید
- ✅ GET /api/search - جستجو
- ✅ GET /api/statistics - آمار سیستم
- ✅ 404 handling
- ✅ CORS preflight
- ✅ Content-Type validation

### 2️⃣ Integration Test Suite (8 tests)
تست workflow های کامل:
- ✅ Complete Prompt Lifecycle (Create → Search → Delete)
- ✅ Multi-Tag Management
- ✅ Concurrent Operations
- ✅ Error Recovery
- ✅ Search Accuracy
- ✅ API Response Consistency
- ✅ Data Integrity
- ✅ Performance Baseline

## 🔧 ساختار پروژه

```
test-simulator/
├── core/
│   └── TestSimulator.ts      # فریمورک اصلی تست
├── suites/
│   ├── api.suite.ts          # تست‌های API
│   ├── database.suite.ts     # تست‌های Database
│   └── integration.suite.ts  # تست‌های یکپارچگی
├── index.ts                  # Entry point
├── package.json
├── tsconfig.json
└── README.md
```

## 📝 نوشتن تست جدید

```typescript
import { TestSuite, TestCase } from '../core/TestSimulator';

export function createMyTestSuite(): TestSuite {
  const tests: TestCase[] = [
    {
      id: 'my-001',
      name: 'My First Test',
      description: 'Testing something important',
      category: 'api', // api | database | integration | performance | stress
      run: async (ctx) => {
        // استفاده از assertions
        ctx.assert.equal(1 + 1, 2, 'Math should work');
        ctx.assert.isTrue(true, 'Boolean check');
        
        // HTTP request
        const response = await fetch('http://localhost:3456/api/prompts');
        ctx.assert.statusCode(response, 200, 'Should return OK');
        
        // Logging
        ctx.log.info('Test passed!');
        
        // Share data between tests
        ctx.data.set('myKey', 'myValue');
      },
    },
  ];

  return {
    id: 'my-suite',
    name: 'My Test Suite',
    description: 'Custom test suite',
    tests,
    setup: async () => {
      console.log('Setup before all tests');
    },
    teardown: async () => {
      console.log('Cleanup after all tests');
    },
  };
}
```

## 🎯 Assertion Helpers

### Basic Assertions
- `assert.equal(actual, expected)` - مقایسه عادی
- `assert.strictEqual(actual, expected)` - مقایسه دقیق (===)
- `assert.deepEqual(obj1, obj2)` - مقایسه عمیق JSON
- `assert.notEqual(actual, expected)`

### Boolean Checks
- `assert.isTrue(value)`
- `assert.isFalse(value)`
- `assert.isNull(value)`
- `assert.isNotNull(value)`
- `assert.isDefined(value)`
- `assert.isUndefined(value)`

### Type Checks
- `assert.isType(value, 'string')` - بررسی نوع
- `assert.isEmpty(array)` - خالی بودن
- `assert.isNotEmpty(array)`
- `assert.lengthOf(array, 5)` - طول آرایه
- `assert.hasProperty(obj, 'key')` - وجود property

### String Checks
- `assert.includes(array, item)` - شامل بودن
- `assert.matches(str, /regex/)` - مطابقت با regex

### Function Checks
- `assert.throws(fn)` - باید خطا بدهد
- `assert.doesNotThrow(fn)` - نباید خطا بدهد

### HTTP Assertions
- `assert.statusCode(response, 200)` - کد وضعیت
- `assert.hasHeader(response, 'Content-Type')` - وجود header
- `assert.jsonSchema(data, schema)` - مطابقت با schema
- `assert.responseTime(duration, 1000)` - زمان پاسخ

## 📈 خروجی نمونه

```
🚀 Prompt Management System - Test Simulator
═══════════════════════════════════════════════

📦 Registering test suites...

🚀 Starting Test Simulator...
ℹ️  INFO: 📦 Suite Started: API Test Suite
ℹ️  INFO: ✅ Test Passed: GET /api/prompts (245ms)
ℹ️  INFO: ✅ Test Passed: POST /api/prompts (312ms)
...

════════════════════════════════════════════════
📊 TEST SUMMARY
════════════════════════════════════════════════
Total Tests: 18
✅ Passed: 18 (100.0%)
❌ Failed: 0 (0.0%)
⏭️  Skipped: 0

Assertions: 127/127 passed
Duration: 3.45s
════════════════════════════════════════════════

✅ All tests passed!
```

## 🔄 توسعه Simulator

### افزودن Test Suite جدید

1. ایجاد فایل در `suites/`:
```typescript
// suites/performance.suite.ts
export function createPerformanceTestSuite(): TestSuite {
  // تست‌های عملکردی
}
```

2. Register در `index.ts`:
```typescript
import { createPerformanceTestSuite } from './suites/performance.suite';

simulator.suite(createPerformanceTestSuite());
```

### افزودن Assertion جدید

در `TestSimulator.ts` → `createTestContext()`:
```typescript
myCustomAssertion: (value, expected, message) => {
  result.assertions.total++;
  if (/* condition */) {
    result.assertions.passed++;
  } else {
    result.assertions.failed++;
    throw new Error(message || 'Assertion failed');
  }
},
```

## 🎨 Configuration Options

```typescript
const config = {
  apiBaseUrl: 'http://localhost:3456',    // آدرس API
  databasePath: './prisma/prompts.db',    // مسیر دیتابیس
  concurrentTests: 5,                     // تعداد تست همزمان
  timeout: 30000,                         // Timeout (ms)
  retryAttempts: 3,                       // تعداد تلاش مجدد
  logLevel: 'info',                       // silent|error|warn|info|debug|verbose
  generateReport: true,                   // ایجاد گزارش
  reportFormat: 'all',                    // json|html|csv|all
};
```

## 📊 Environment Variables

```bash
# API URL
export API_URL=http://localhost:3456

# Log Level
export LOG_LEVEL=verbose  # silent|error|warn|info|debug|verbose

# Database Path
export DB_PATH=./prisma/prompts.db
```

## 🐛 عیب‌یابی

### تست‌ها fail می‌شوند
```bash
# اجرا با log مفصل
npm run test:debug

# بررسی API در حال اجرا است
curl http://localhost:3456/api/prompts
```

### Performance کند است
```bash
# کاهش concurrent tests
# در index.ts: concurrentTests: 1
```

## 🔮 آینده (Roadmap)

- [ ] Performance Test Suite (load testing)
- [ ] Stress Test Suite (concurrent heavy operations)
- [ ] Report Generator (HTML dashboard)
- [ ] Code Coverage Analysis
- [ ] Screenshot/Video capture for UI tests
- [ ] CI/CD Integration (GitHub Actions)
- [ ] Webhook notifications
- [ ] Distributed testing across multiple machines

## 📄 License

MIT

---

**ساخته شده با ❤️ برای تست کامل Prompt Management System**
