import { reflow } from '.';

const logoWidth = '56px';

const resetTransform = (el: HTMLElement) => {
  el.style.transform = '';
  el.style.transformOrigin = '';
};
export const onEnterLogo = (logoEl: HTMLElement, isRTL: boolean) => {
  const navList = logoEl.nextElementSibling as HTMLElement;
  if (!navList) return;
  const elements = [logoEl, navList];

  logoEl.style.transformOrigin = `${isRTL ? 'right' : 'left'} center`;
  navList.style.transform = `translateX(${isRTL ? '' : '-'}${logoWidth})`;

  reflow();
  navList.style.transform = `translateX(0)`;
  const cleanup = () => {
    logoEl.removeEventListener('transitionend', onEnd);
    elements.forEach(resetTransform);
  };
  const onEnd = (e: TransitionEvent) => {
    if (e.target !== e.currentTarget) return;
    cleanup();
  };
  logoEl.addEventListener('transitionend', onEnd);
  return cleanup;
};

export const onExitLogo = (logoEl: HTMLElement, isRTL: boolean) => {
  const navList = logoEl.nextElementSibling as HTMLElement;
  if (!navList) return;
  const elements = [logoEl, navList];

  navList.style.transform = `translateX(${isRTL ? '-' : ''}${logoWidth})`;

  reflow();
  logoEl.style.transformOrigin = `${isRTL ? 'right' : 'left'} center`;
  navList.style.transform = `translateX(0)`;

  elements.forEach((el) => {
    el.style.backfaceVisibility = 'hidden';
  });

  const cleanup = () => {
    logoEl.removeEventListener('transitionend', onEnd);
    elements.forEach((el) => {
      resetTransform(el);
      el.style.backfaceVisibility = '';
    });
  };
  const onEnd = (e: TransitionEvent) => {
    if (e.target !== e.currentTarget) return;
    cleanup();
  };
  logoEl.addEventListener('transitionend', onEnd);
  return cleanup;
};
