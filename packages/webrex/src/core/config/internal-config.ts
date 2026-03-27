import {
  filter,
  firstValueFrom,
  from,
  interval,
  map,
  merge,
  of,
  shareReplay,
  switchMap,
  zip,
} from 'rxjs';
import { WebRexConfiguration } from '@models/configuration.ts';
import { noSqlDb } from '../database/no-sql-db.ts';
import { startTelemetry } from '../bootstrap/telemetry.ts';
import { install } from '../bootstrap/install.ts';
import { realtimeChanges$ } from '../bootstrap/realtime.stream.ts';
import { DB_PATH } from './constants/app.constants.ts';
import defaultConfiguration from './constants/default-configuration.ts';
import defaultConfigurationRaw from './constants/default-configuration.ts' with { type: 'text' };

export class InternalConfig {
  db$ = from(noSqlDb(DB_PATH)).pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private readonly settingsDocument$ = merge(
    interval(5000),
    realtimeChanges$.asObservable().pipe(
      map((evt) => evt.data.data),
      filter((data) => data?.entity === 'settings')
    )
  ).pipe(
    switchMap(() => this.db$),
    switchMap((db) => db.settings.getOne()),
    filter((settingsDocument) => settingsDocument !== null),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly config$ = this.settingsDocument$.pipe(
    map(
      (settingsDocument) =>
        new WebRexConfiguration(settingsDocument.value.codeJS)
    ),
    switchMap((webRexConfiguration) =>
      zip(
        of(webRexConfiguration),
        this.mapRoutesHealth(webRexConfiguration.proxy)
      )
    ),
    map(
      ([webrexConfiguration, healthCheckedRoutes]) =>
        new WebRexConfiguration({
          ...webrexConfiguration,
          proxy: healthCheckedRoutes,
        })
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor() {
    this.init();
  }

  private async init() {
    this.db$.subscribe(); // we subscribe to keep subscription alive so that "shareReplay" works as intended
    const db = await firstValueFrom(this.db$);
    await startTelemetry({ db });

    await install({ db });

    await db.weblogs.deleteMany(); // resets the store logs from browser console. Do not mistake with serverlogs, which used in telemetry
    await db.reploutput.deleteMany(); // resets the reploutput which is just contains all snippets executed. We don't need to keep them between sessions
    await db.proxylogs.deleteMany(); // resets the proxylogs. We don't need to keep them between sessions

    // Add default settings in case none exist (which happens in first install)
    const existingConfSaved = await db.settings.getOne();
    if (!existingConfSaved?.id) {
      await db.settings.add({
        codeTS: defaultConfigurationRaw,
        codeJS: defaultConfiguration,
      });
    }

    this.config$.subscribe(); // we subscribe to keep subscription alive so that "shareReplay" works as intended
  }

  /**
   * Mapper used verify routes health and save it in a boolean flag.
   * This is useful to improve the performance of proxy engine, avoiding to
   * call unresponsive endpoints.
   */
  private async mapRoutesHealth(routes: WebRexConfiguration['proxy']) {
    return await Promise.all(
      routes.map(async (route) => {
        let context = route.context;
        if (route.pathRewrite) {
          Object.entries(route.pathRewrite ?? {}).forEach(([k, v]) => {
            context = context.replace(new RegExp(k), v);
          });
        }

        const isHealthy = await fetch(
          route.target.replace(/\/*$/, '') +
            context.replace(/\/*$/, '') +
            '/index.html',
          {
            method: 'HEAD',
          }
        )
          .then(() => true)
          .catch(() => false);

        return { ...route, isHealthy };
      })
    );
  }
}
