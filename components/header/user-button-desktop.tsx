// components/header/user-button-desktop.tsx
'use client'

import { Button } from '@/components/common/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/dropdown-menu'
import { User } from 'lucide-react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useAuthStore } from '@/store/auth-store'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function UserButtonDesktop() {
  const { user, setUser } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        setUser(data?.user ?? null)
      } catch (error) {
        console.error('Failed to load session:', error)
      }
    }

    if (!user) {
      loadSession()
    }
  }, [user, setUser])

  if (!user) {
    return (
      <Link href='/login'>
        <Button variant='outline' className='flex items-center gap-2'>
          <User className='w-4 h-4' />
          Sign In
        </Button>
      </Link>
    )
  }

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false })
      router.push('/login')
      router.refresh()
      window.location.reload()
    } catch (error) {
      console.error('Logout failed:', error)
      router.push('/login?error=logout_failed')
      window.location.reload()
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='flex items-center gap-2'>
          <span className='hidden sm:inline'>{user.name}</span>
          <User className='w-4 h-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuItem asChild>
          <Link href='/account'>Account</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>Sign Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
