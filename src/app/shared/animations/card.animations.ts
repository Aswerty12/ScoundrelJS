import { animate, style, transition, trigger } from '@angular/animations';

export const cardStateAnimation = trigger('cardState', [
  transition(':enter', [
    style({ transform: 'translateY(-10px) scale(0.98)', opacity: 0 }),
    animate('180ms ease-out', style({ transform: 'translateY(0) scale(1)', opacity: 1 })),
  ]),
  transition(':leave', [animate('140ms ease-in', style({ transform: 'translateY(10px)', opacity: 0 }))]),
]);

export const shakeAnimation = trigger('shakeState', [
  transition('* => shake', [
    animate(
      '280ms ease-out',
      style({ transform: 'translateX(0)' }),
    ),
  ]),
]);
