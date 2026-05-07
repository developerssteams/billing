import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const AuthGuard: CanActivateFn = () => {

  const router = inject(Router);
  const token = localStorage.getItem('token');

  console.log('TOKEN:', token);

  if (token && token !== 'undefined' && token !== 'null') {
    return true;
  }

  router.navigate(['/authentication/login']);
  return false;
};