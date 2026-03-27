import { type } from 'arktype';
import { CodeDocument } from './code-document';

const ProxyRouteSchema = type({
  'name?': 'string',
  context: 'string',
  'pathRewrite?': type({
    '[string]': 'string',
  }),
  target: type('/^(https?|file):\\/\\/.+/'),
  'disabled?': 'boolean',
  'isHealthy?': 'boolean',
});

const WebRexConfigurationSchema = type({
  'hostname?': 'string',
  'port?': 'number',
  'forceMock?': 'boolean',
  'mockpath?': 'string',
  'tunnelingToken?': 'string',
  'tunnelingDomain?': 'string',
  'tunnelingEnabled?': 'boolean',
  proxy: ProxyRouteSchema.array(),
  'mockFromHAR?': ProxyRouteSchema,
});

export type SettingsDocument = typeof SettingsDocument.infer;
export const SettingsDocument = type({
  '...': CodeDocument,
  codeJS: WebRexConfigurationSchema,
});
