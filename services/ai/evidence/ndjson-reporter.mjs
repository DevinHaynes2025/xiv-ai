/**
 * Node's built-in reporters are written for people. The evidence collector
 * needs the raw event stream, so this reporter emits one JSON object per test
 * event and nothing else.
 *
 * Plain JavaScript on purpose: the test runner loads a reporter outside the
 * tsx loader, so a TypeScript file here would fail to resolve.
 */
export default async function* ndjsonReporter(source) {
  for await (const event of source) {
    yield `${JSON.stringify(event)}\n`;
  }
}
