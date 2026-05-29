import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

const agreementKey = 'crud_app_privacy_agreed';

export const welcomeAgreementGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (localStorage.getItem(agreementKey) === 'true') {
    return router.createUrlTree(['/home']);
  }

  return true;
};
