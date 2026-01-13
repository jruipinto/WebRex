import os from 'node:os';
import { normalize } from 'node:path';

export const APP_NAME = 'WebRex';
export const INSTALL_PATH = normalize(os.homedir() + '/' + APP_NAME);
export const WEB_UI_PATH = normalize(INSTALL_PATH + '/web-ui');
export const DB_PATH = normalize(INSTALL_PATH + '/db.nosql');
