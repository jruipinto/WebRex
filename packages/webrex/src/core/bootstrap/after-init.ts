import { connect as ngrokConnect } from '@ngrok/ngrok';
import QrCode from 'qrcode-terminal';
import { InternalConfig } from '@core/config/internal-config.ts';
import { firstValueFrom } from 'rxjs';

export function afterInit(conf: InternalConfig) {
  return async ({ port }: { port: number }) => {
    const config = await firstValueFrom(conf.config$);
    console.log(`\nServer started at http://${config.hostname}:${port}`);
    console.log(
      `WebRex UI running at http://${config.hostname}:${port}/webrex-ui`
    );

    // start and ngrok tunnel to allow sharing local instance with anyone, like QAs
    if (config.tunnelingEnabled && !Deno.args.includes('--watch')) {
      ngrokConnect({
        addr: `${config.hostname}:${port}`,
        authtoken: config.tunnelingToken,
      })
        .then((listener) => {
          console.log(`Tunnel established at: ${listener.url()}`);
          QrCode.generate(listener.url(), { small: true });
        })
        .catch((err: Error) => {
          console.log(
            'NgRok tunnel failed to start. Verify your token and errors.',
            err
          );
        });
    }
  };
}
