import { DB_PATH } from './constants/app.constants.ts';
import { WebRexConfiguration } from '@models/configuration.ts';
import { NoSqlDB } from '../database/no-sql-db.ts';
import { startTelemetry } from '../bootstrap/telemetry.ts';
import { install } from '../bootstrap/install.ts';
import { noSqlDb } from '../database/no-sql-db.ts';
import defaultConfiguration from './constants/default-configuration.ts';
import defaultConfigurationRaw from './constants/default-configuration.ts' with { type: 'text' };

export class InternalConfig {
  static #db: Promise<NoSqlDB>;
  static #configVersionstamp = '';

  get db(): Promise<NoSqlDB> {
    if (!InternalConfig.#db) {
      InternalConfig.#db = InternalConfig.#initDB();
    }
    return InternalConfig.#db;
  }

  static config: Promise<WebRexConfiguration>;

  get config(): Promise<WebRexConfiguration> {
    if (!InternalConfig.config) {
      InternalConfig.config = InternalConfig.#initConfig(this);
      InternalConfig.regularlyCheckHealthOfProxyRoutes();
    }
    return InternalConfig.config;
  }

  static async #initDB() {
    return await noSqlDb(DB_PATH);
  }

  // TODO: refactor health check.
  // This is super hacky and not trust-worthy.
  // It's done this way just to test how well the healthchecks can improve fallback
  // performance without breaking main functionality of proxy.
  // A suggestion could be moving this logic to the place that makes more sense and throttle the healthCheck call, instead of using setInterval
  static regularlyCheckHealthOfProxyRoutes() {
    const performHealthCheckCb = async () => {
      const config = await InternalConfig.config;
      await Promise.allSettled(
        config.proxy.map((route) => {
          let context = route.context;
          if (route.pathRewrite) {
            Object.entries(route.pathRewrite ?? {}).forEach(([k, v]) => {
              context = context.replace(new RegExp(k), v);
            });
          }
          return fetch(
            route.target.replace(/\/*$/, '') +
              context.replace(/\/*$/, '') +
              '/index.html',
            {
              method: 'HEAD',
            }
          )
            .then(({ ok }) => {
              route.isHealthy = ok;
            })
            .catch(() => {
              route.isHealthy = false;
            });
        })
      );
      InternalConfig.config = Promise.resolve(config);
    };

    performHealthCheckCb();
    setInterval(() => performHealthCheckCb(), 5000);
  }

  static async #initConfig(instance: InternalConfig) {
    const db = await instance.db;
    await install(db);

    const existingConfSaved = await db.settings.getOne();
    InternalConfig.#configVersionstamp = existingConfSaved?.versionstamp ?? '';

    if (!existingConfSaved?.id) {
      await db.settings.add({
        codeTS: defaultConfigurationRaw,
        codeJS: JSON.stringify(defaultConfiguration),
      });
    }

    const confSaved = existingConfSaved?.id
      ? existingConfSaved
      : await db.settings.getOne();
    InternalConfig.#configVersionstamp = existingConfSaved?.versionstamp ?? '';

    const webrexConfig = new WebRexConfiguration(
      JSON.parse(confSaved!.value.codeJS)
    );
    InternalConfig.config = Promise.resolve(webrexConfig);

    db.settings.watch(confSaved!.id, (doc) => {
      if (
        !doc ||
        !doc.versionstamp ||
        doc.versionstamp === InternalConfig.#configVersionstamp
      ) {
        return;
      }
      InternalConfig.#configVersionstamp = doc.versionstamp;

      InternalConfig.config = Promise.resolve(
        new WebRexConfiguration(JSON.parse(doc.value.codeJS))
      );
    });

    await db.weblogs.deleteMany(); // resets the store logs from browser console. Do not mistake with serverlogs, which used in telemetry
    await startTelemetry({ db });

    return webrexConfig;
  }
}
