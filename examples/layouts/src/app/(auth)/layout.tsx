import React from 'react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div>Auth Header (from auth layout)</div>
      {children}
      <div>Auth Footer (from auth layout)</div>
    </>
  )
}
