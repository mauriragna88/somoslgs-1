'use client'

import CartDrawer from './CartDrawer'
import CartButton from './CartButton'

export default function CartProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CartButton />
      <CartDrawer />
    </>
  )
}
