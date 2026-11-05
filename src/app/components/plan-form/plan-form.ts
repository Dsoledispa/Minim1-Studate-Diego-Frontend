import { DatePipe, LowerCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import {
  DATE_STATUS_LABELS,
  GradeUser,
  MAX_SPINS,
  PLAN_STATUS_LABELS,
  Plan,
  PlanStatus,
  Spin,
  SpinInput,
  StudateDate,
} from '../../models';
import { DateService } from '../../services/date.service';
import { PlanService } from '../../services/plan.service';
import { apiErrorMessage } from '../../utils/api-error';
import { Avatar } from '../avatar/avatar';

// Una tirada dentro del formulario
type SpinForm = FormGroup<{
  place: FormControl<string>;
  walkingMinutes: FormControl<number | null>;
  scheduledAt: FormControl<string>;
  accepted: FormControl<boolean>;
}>;

// Validador de grupo con las mismas reglas que Joi en la API (así el admin las ve antes de enviar):
//   - como mucho una tirada aceptada
//   - un Plan confirmado necesita su tirada aceptada
const planRulesValidator: ValidatorFn = (control): ValidationErrors | null => {
  const status = control.get('status')?.value as PlanStatus;
  const spins = (control.get('spins') as FormArray<SpinForm>).controls;
  const accepted = spins.filter((spin) => spin.controls.accepted.value).length;

  if (accepted > 1) {
    return { manyAccepted: true };
  }
  if (status === 'confirmed' && accepted === 0) {
    return { confirmedWithoutAccepted: true };
  }
  return null;
};

// "2026-11-07T16:00:00.000Z" -> "2026-11-07T17:00": el input datetime-local usa la hora local sin zona
const toLocalInput = (iso: string): string => {
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

// Formulario y detalle de un Plan, dentro de la lista de Planes (backoffice, solo admin).
//   planId null        crear un Plan (POST /plans)
//   planId de un Plan  pedir su detalle (GET /plans/:id) y editarlo (PUT /plans/:id)
//   Plan archivado     solo lectura: para cambiarlo hay que restaurarlo desde la lista
@Component({
  selector: 'app-plan-form',
  imports: [ReactiveFormsModule, DatePipe, LowerCasePipe, Avatar],
  templateUrl: './plan-form.html',
  styleUrl: './plan-form.css',
})
export class PlanForm {
  private fb = inject(NonNullableFormBuilder);
  private planService = inject(PlanService);
  private dateService = inject(DateService);

  planId = input<string | null>(null);
  // Al crear, el Date que viene elegido (el del filtro de la lista, si lo hay)
  dateId = input('');

  saved = output<Plan>();
  closed = output<void>();

  maxSpins = MAX_SPINS;
  statusLabels = PLAN_STATUS_LABELS;
  statuses = Object.keys(PLAN_STATUS_LABELS) as PlanStatus[];
  dateStatusLabels = DATE_STATUS_LABELS;

  plan = signal<Plan | null>(null);
  // Los Dates que se pueden elegir al crear: los que no están cerrados
  dates = signal<StudateDate[]>([]);
  loading = signal(false);
  saving = signal(false);
  error = signal('');

  readOnly = computed(() => this.plan()?.deleted ?? false);
  title = computed(() =>
    !this.planId() ? 'Nuevo Plan' : this.readOnly() ? 'Plan archivado' : 'Editar Plan',
  );

  form = this.fb.group(
    {
      date: ['', Validators.required],
      status: this.fb.control<PlanStatus>('proposing'),
      spins: this.fb.array<SpinForm>([]),
    },
    { validators: planRulesValidator },
  );

  get spins(): FormArray<SpinForm> {
    return this.form.controls.spins;
  }

  constructor() {
    // Cada vez que cambia el Plan elegido en la lista, se rellena el formulario de nuevo
    effect(() => {
      const id = this.planId();
      untracked(() => (id ? this.load(id) : this.startNew()));
    });

    // Al abrirse, la pantalla baja hasta el formulario
    const host = inject<ElementRef<HTMLElement>>(ElementRef);
    afterNextRender(() =>
      host.nativeElement.scrollIntoView?.({ behavior: 'smooth', block: 'start' }),
    );
  }

  coupleName(users: GradeUser[]): string {
    return users.map((user) => user.name).join(' y ');
  }

  addSpin(): void {
    if (this.spins.length < MAX_SPINS) {
      this.spins.push(this.newSpin());
    }
  }

  removeSpin(index: number): void {
    if (this.spins.length > 1) {
      this.spins.removeAt(index);
    }
  }

  // Solo una tirada aceptada: al marcar una, se desmarcan las demás
  onAccepted(index: number, checked: boolean): void {
    if (!checked) {
      return;
    }
    this.spins.controls.forEach((spin, i) => {
      if (i !== index) {
        spin.controls.accepted.setValue(false);
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // getRawValue incluye el Date aunque esté desactivado (al editar)
    const { date, status, spins } = this.form.getRawValue();
    // Lo que espera la API: sin _id y con la fecha en ISO (UTC)
    const payload: SpinInput[] = spins.map((spin) => ({
      place: spin.place.trim(),
      walkingMinutes: Number(spin.walkingMinutes),
      scheduledAt: new Date(spin.scheduledAt).toISOString(),
      accepted: spin.accepted,
    }));

    const id = this.planId();
    const request = id
      ? this.planService.updatePlan(id, { status, spins: payload })
      : this.planService.createPlan({ date, status, spins: payload });

    this.saving.set(true);
    this.error.set('');
    request.subscribe({
      next: (response) => this.saved.emit(response.plan),
      // 409 (el Date ya tiene Plan, está cerrado o el Plan está archivado) o 422: el motivo de la API
      error: (err: HttpErrorResponse) => {
        this.error.set(apiErrorMessage(err));
        this.saving.set(false);
      },
    });
  }

  // Crear: el Date del filtro (si lo hay), "Proponiendo" y una tirada vacía
  private startNew(): void {
    this.plan.set(null);
    this.error.set('');
    this.form.enable();
    this.form.reset({ date: this.dateId(), status: 'proposing' });
    this.spins.clear();
    this.spins.push(this.newSpin());

    if (this.dates().length === 0) {
      this.dateService.getDates(1, 100, { status: '', user: '' }).subscribe({
        next: (response) =>
          this.dates.set(response.dates.filter((date) => date.status !== 'closed')),
        error: (err: HttpErrorResponse) => this.error.set(apiErrorMessage(err)),
      });
    }
  }

  // Editar o ver: el detalle se pide a la API (GET /plans/:id) para tener los datos al día
  private load(id: string): void {
    this.loading.set(true);
    this.error.set('');
    this.planService.getPlan(id).subscribe({
      next: ({ plan }) => {
        this.plan.set(plan);
        this.form.reset({ date: plan.date._id, status: plan.status });
        this.spins.clear();
        plan.spins.forEach((spin) => this.spins.push(this.newSpin(spin)));

        // Archivado: todo en solo lectura. Si no, todo editable menos el Date
        if (plan.deleted) {
          this.form.disable();
        } else {
          this.form.enable();
          this.form.controls.date.disable();
        }
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  private newSpin(spin?: Spin): SpinForm {
    return this.fb.group({
      // Un sitio de verdad: no vale solo con espacios
      place: [
        spin?.place ?? '',
        [Validators.required, Validators.maxLength(100), Validators.pattern(/\S/)],
      ],
      // Minutos enteros entre 0 y 120, como en la API
      walkingMinutes: this.fb.control<number | null>(spin?.walkingMinutes ?? null, [
        Validators.required,
        Validators.min(0),
        Validators.max(120),
        Validators.pattern(/^\d+$/),
      ]),
      scheduledAt: [spin ? toLocalInput(spin.scheduledAt) : '', Validators.required],
      accepted: [spin?.accepted ?? false],
    });
  }
}
