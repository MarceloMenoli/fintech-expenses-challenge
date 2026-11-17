require('dotenv').config();
const url = process.env.TEST_DATABASE_URL;
if (!url)
  throw new Error('Set TEST_DATABASE_URL to a dedicated database whose name ends with _test.');
const parsed = new URL(url);
if (!parsed.pathname.endsWith('_test') || url === process.env.DATABASE_URL) {
  throw new Error('Tests require a separate database whose name ends with _test.');
}
process.env.DATABASE_URL = url;
process.env.JWT_SECRET = 'integration-tests-only-secret-at-least-32-characters';
process.env.FRONTEND_URL = 'http://localhost:5173';
