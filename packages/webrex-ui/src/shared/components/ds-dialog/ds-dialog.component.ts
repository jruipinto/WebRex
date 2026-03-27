import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type DsDialogOutput = {
  btnClicked?: 'primary' | 'secondary';
  promptAnswer?: string;
};
export type DsDialogInput = {
  header: string;
  message?: string;
  primaryBtn?: string;
  secondaryBtn?: string;
  variant?: 'alert' | 'prompt' | 'custom';
};

@Component({
  selector: 'ds-dialog',
  templateUrl: './ds-dialog.component.html',
  styleUrl: './ds-dialog.component.css',
  imports: [FormsModule],
})
export class DsDialogComponent {
  dialogRef = inject(DialogRef<DsDialogOutput, DsDialogComponent>);
  data = inject<DsDialogInput>(DIALOG_DATA);
  $promptAnswer = model('');
}
