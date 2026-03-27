import { Injectable, signal } from '@angular/core';
import { initialize } from 'esbuild-wasm/esm/browser';

@Injectable({ providedIn: 'root' })
export class EditorService {
  private $isInitialized = signal(false);

  async initializeESBuild() {
    if (this.$isInitialized()) {
      return;
    }
    try {
      await initialize({
        wasmURL: `/webrex-ui/assets/esbuild.wasm`,
      });

      this.$isInitialized.set(true);
    } catch (error) {
      console.log(error);
    }
  }
}
