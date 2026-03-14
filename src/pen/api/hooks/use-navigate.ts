import { useContext } from 'react'
import { NavigationContext } from '../NavigationProvider'

export function useNavigate() {
  const context = useContext(NavigationContext)
  if (!context) throw new Error('useRouter must be used within a NavigationProvider')
  return context
}
