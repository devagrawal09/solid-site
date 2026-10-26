import { createEffect, isPending } from 'solid-js';
import { cookieStorage } from '@solid-primitives/storage';
import { createCollection, createCart } from '../utils/shopify';

const settings = {
  token: '98a442cbab63cb1697002bfae7dc648a',
  domain: 'solidjs.myshopify.com',
};

export const StoreData = () => {
  const [collection] = createCollection(() => 'gid://shopify/Collection/285612933298', settings);
  const id = cookieStorage.getItem('cartId');
  const commerce = createCart(id, settings);
  createEffect(
    () => [commerce.loading(), commerce.cart.id] as const,
    ([loading, cartId]) => {
      if (!loading && cartId && String(cartId) !== cookieStorage.getItem('cartId')) {
        cookieStorage.setItem('cartId', String(cartId));
      }
    },
  );
  return {
    get commerce() {
      return commerce;
    },
    get loading() {
      return isPending(collection);
    },
    get products() {
      return collection().products ?? [];
    },
  };
};
