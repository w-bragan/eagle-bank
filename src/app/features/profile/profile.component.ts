import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>ProfileComponent</p>`,
})
export class ProfileComponent {}
