import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { CardComponent } from '../../shared/components/card/card.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    CardComponent,
    PageHeaderComponent,
    ModalComponent,
    AlertComponent,
    ButtonComponent,
    InputComponent,
  ],
  template: `
    <div class="animate-fade-in">
      <app-page-header title="Profile" subtitle="Manage your personal information." />

      <div class="max-w-2xl">
        <eb-card>
          <div
            class="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-border"
          >
            <div
              class="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0"
            >
              @if (user()?.avatarUrl) {
                <img
                  [src]="user()?.avatarUrl"
                  alt="Profile photo"
                  class="w-full h-full object-cover"
                />
              } @else {
                <span class="text-2xl font-semibold text-primary-600" aria-hidden="true">{{
                  initials()
                }}</span>
              }
            </div>

            <div class="flex-1 text-center sm:text-left">
              <h2 class="text-xl font-bold text-text-primary">{{ user()?.name }}</h2>
              <p class="text-sm text-text-secondary mt-0.5">{{ user()?.email }}</p>
              <div class="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                <eb-button variant="primary" size="sm" (click)="openEditModal()">
                  <span class="material-icons text-[16px] leading-none" aria-hidden="true"
                    >edit</span
                  >
                  Edit Profile
                </eb-button>
                <eb-button variant="secondary" size="sm" (click)="showAvatarModal.set(true)">
                  <span class="material-icons text-[16px] leading-none" aria-hidden="true"
                    >photo_camera</span
                  >
                  Change Photo
                </eb-button>
              </div>
            </div>
          </div>

          <div class="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <p class="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">Email</p>
              <p class="text-sm text-text-primary">{{ user()?.email || '—' }}</p>
            </div>
            <div>
              <p class="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">Phone</p>
              <p class="text-sm text-text-primary">{{ user()?.phone || '—' }}</p>
            </div>
            <div class="sm:col-span-2">
              <p class="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                Address
              </p>
              <p class="text-sm text-text-primary">{{ user()?.address || '—' }}</p>
            </div>
          </div>
        </eb-card>
      </div>

      <eb-modal [open]="showEditModal()" ariaLabel="Edit profile" (closed)="closeEditModal()">
        <div ebModalTitle class="flex items-center gap-3">
          <span
            class="material-icons text-[22px] text-text-secondary leading-none"
            aria-hidden="true"
            >edit</span
          >
          <p class="text-sm font-semibold text-text-primary">Edit Profile</p>
        </div>
        <form [formGroup]="editForm" (ngSubmit)="saveProfile()" class="space-y-4" novalidate>
          @if (saveError()) {
            <eb-alert type="error" [message]="saveError()!" />
          }
          <div class="mb-2">
            <eb-input
              label="Full name"
              formControlName="name"
              [required]="true"
              [error]="fieldError('name')"
            />
          </div>
          <div class="mb-2">
            <eb-input
              label="Email"
              type="email"
              formControlName="email"
              [required]="true"
              [error]="fieldError('email')"
            />
          </div>
          <div class="mb-2">
            <eb-input label="Phone" type="tel" formControlName="phone" />
          </div>
          <div class="mb-2">
            <eb-input label="Address" formControlName="address" />
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <eb-button variant="secondary" type="button" (click)="closeEditModal()"
              >Cancel</eb-button
            >
            <eb-button type="submit" [loading]="isSaving()">Save changes</eb-button>
          </div>
        </form>
      </eb-modal>

      <eb-modal [open]="showAvatarModal()" ariaLabel="Upload photo" (closed)="closeAvatarModal()">
        <div ebModalTitle class="flex items-center gap-3">
          <span
            class="material-icons text-[22px] text-text-secondary leading-none"
            aria-hidden="true"
            >photo_camera</span
          >
          <p class="text-sm font-semibold text-text-primary">Upload Photo</p>
        </div>
        <div
          class="rounded-lg border-2 border-dashed overflow-hidden transition-colors"
          [class]="avatarPreview() ? 'border-primary-400' : 'border-border'"
        >
          @if (avatarPreview(); as preview) {
            <img [src]="preview" alt="Avatar preview" class="w-full max-h-56 object-cover" />
          } @else {
            <div
              class="flex flex-col items-center justify-center py-10 gap-2 text-text-muted cursor-pointer hover:bg-surface-muted transition-colors"
              (click)="fileInput.click()"
            >
              <span class="material-icons text-[44px] leading-none" aria-hidden="true"
                >cloud_upload</span
              >
              <p class="text-sm font-medium text-text-secondary">
                Click to browse or drag &amp; drop
              </p>
              <p class="text-xs">PNG, JPG or GIF · max 5 MB</p>
            </div>
          }
        </div>

        <input
          #fileInput
          type="file"
          accept="image/*"
          class="hidden"
          (change)="onFileSelected($event)"
        />

        <div class="flex items-center justify-between mt-4">
          <eb-button variant="ghost" size="sm" (click)="fileInput.click()">
            <span class="material-icons text-[16px] leading-none" aria-hidden="true"
              >folder_open</span
            >
            Browse files
          </eb-button>
          <div class="flex gap-2">
            @if (avatarPreview()) {
              <eb-button variant="ghost" size="sm" (click)="clearAvatarPreview()">Remove</eb-button>
            }
            <eb-button size="sm" [disabled]="!avatarPreview()" (click)="closeAvatarModal()"
              >Save photo</eb-button
            >
          </div>
        </div>
        <p class="text-xs text-text-muted mt-3">
          Visual preview only — not persisted after refresh.
        </p>
      </eb-modal>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);

  protected user = this.auth.user;
  protected initials = computed(() => {
    const name = this.user()?.name ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .map((w: string) => w[0].toUpperCase())
      .slice(0, 2)
      .join('');
  });

  protected showEditModal = signal(false);
  protected showAvatarModal = signal(false);
  protected isSaving = signal(false);
  protected saveError = signal<string | null>(null);
  protected avatarPreview = signal<string | null>(null);

  protected editForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    address: [''],
  });

  ngOnInit(): void {}

  protected openEditModal(): void {
    const u = this.user();
    this.editForm.reset({
      name: u?.name ?? '',
      email: u?.email ?? '',
      phone: u?.phone ?? '',
      address: u?.address ?? '',
    });
    this.saveError.set(null);
    this.showEditModal.set(true);
  }

  protected closeEditModal(): void {
    this.showEditModal.set(false);
    this.saveError.set(null);
  }

  protected closeAvatarModal(): void {
    this.showAvatarModal.set(false);
    this.avatarPreview.set(null);
  }

  protected clearAvatarPreview(): void {
    this.avatarPreview.set(null);
  }

  protected onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => this.avatarPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  protected saveProfile(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    this.saveError.set(null);
    this.auth.updateProfile(this.editForm.getRawValue() as Record<string, string>).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeEditModal();
      },
      error: (err: { error?: { message?: string } }) => {
        this.isSaving.set(false);
        this.saveError.set(err?.error?.message ?? 'Failed to save. Please try again.');
      },
    });
  }

  protected fieldError(field: string): string | null {
    const ctrl = this.editForm.get(field);
    if (!ctrl?.invalid || !ctrl?.touched) return null;
    if (ctrl.hasError('required'))
      return field.charAt(0).toUpperCase() + field.slice(1) + ' is required.';
    if (ctrl.hasError('email')) return 'Please enter a valid email address.';
    return null;
  }
}
