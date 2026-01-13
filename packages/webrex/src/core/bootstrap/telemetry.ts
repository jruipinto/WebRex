import { NoSqlDB } from '@core/database/no-sql-db.ts';
import { serverLogStream$ } from './telemetry.stream.ts';

export async function startTelemetry({ db }: { db: NoSqlDB }) {
  await db.serverlogs.deleteMany(); // reset logs session (we don't need to keep logs from other sessions)

  const origLog = console.log;
  console.log = async (...args) => {
    const msg = args
      .map((i) => (typeof i === 'string' ? i : tryToStringify(i)))
      .join(' ')
      .trim()
      .slice(0, 4095); // avoids overflow

    //  Save to DB (Persistence)
    await db.serverlogs.add(msg);

    // Push to the stream (Real-time)
    serverLogStream$.next(msg);

    origLog(...args);
  };
}

function tryToStringify(i: unknown) {
  try {
    const result = JSON.stringify(i, excludeCircularReplacer(), 2);
    return result;
  } catch (_) {
    return String(i);
  }
}

function excludeCircularReplacer() {
  const seen = new WeakSet<object>();

  return function replacer(_key: string, value: unknown) {
    if (value && typeof value === 'object') {
      if (seen.has(value)) {
        // exclude circular reference
        return undefined;
      }
      seen.add(value);
    }
    return value;
  };
}
