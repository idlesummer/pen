import React from 'react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div>Header (from root layout)</div>
      {children}
      <div>Footer (from root layout)</div>
    </>
  )
}
