import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

// Página de inicio para cualquier usuario con sesión.
@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
})
export class Home {
  auth = inject(AuthService);
}
