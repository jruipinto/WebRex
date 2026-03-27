import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DsDialogComponent, DsDialogInput, DsDialogOutput } from 'src/shared';
import { Dialog } from '@angular/cdk/dialog';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(Dialog);

  /** Displays an alert dialog with the defined message */
  async showWarning(message: string): Promise<void> {
    await firstValueFrom(
      this.dialog.open<DsDialogOutput, DsDialogInput, DsDialogComponent>(
        DsDialogComponent,
        {
          data: {
            variant: 'alert',
            header: 'Warning!',
            message,
            primaryBtn: 'Ok',
          },
        }
      ).closed
    );
  }

  async showPrompt(params: DsDialogInput = defaultPromptParams) {
    const promptResult = await firstValueFrom(
      this.dialog.open<DsDialogOutput, DsDialogInput, DsDialogComponent>(
        DsDialogComponent,
        {
          data: params,
        }
      ).closed
    );

    return promptResult;
  }
}

const defaultPromptParams = {
  header: 'Are you sure?',
  primaryBtn: 'Yes',
  secondaryBtn: 'Cancel',
} as const;
