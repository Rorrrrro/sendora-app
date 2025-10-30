"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  Users,
  Menu,
  X,
  Mail,
  Bell,
  FileText,
  Home,
  Building,
  ChevronDown,
  CreditCard,
  LogOut,
  Send,
  User,
  Palette,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUser } from "@/contexts/user-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  {
    title: "Accueil",
    href: "/accueil",
    icon: Home,
  },
  {
    title: "Contacts",
    href: "/contacts",
    icon: Users,
  },
  {
    title: "Listes",
    href: "/listes", // Changed from "/lists" to "/listes"
    icon: FileText,
  },
  {
    title: "Templates",
    href: "/templates",
    icon: Palette,
  },
  {
    title: "Campagnes",
    href: "/campagnes",
    icon: Send,
  },
  {
    title: "Statistiques",
    href: "/statistiques",
    icon: BarChart3,
  },
]

// Fonction utilitaire pour retrouver la couleur d'avatar personnalisée (localStorage)
function getStoredAvatarColor(user: any) {
  if (!user || typeof window === 'undefined') return null;
  try {
    const key = `avatarColor_${user.prenom || ''}_${user.nom || ''}`;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut, isLoading, customAvatarColor } = useUser()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for mobile */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-[#f4f4fd]">
          <div className="flex h-16 items-center justify-between border-b border-[#EBE0FF] px-4">
            <div className="flex items-center">
              <div className="h-16 w-full flex justify-center items-center ml-4">
                <img src="/Sendora.png" alt="Sendora Logo" className="h-11 w-auto object-contain" />
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            <div className="flex flex-col space-y-3">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-base transition-colors rounded-2xl
                      ${isActive
                        ? "bg-sidebar-selected-bg text-sidebar-active font-bold"
                        : "text-sidebar hover:text-sidebar-active hover:bg-sidebar-hover-bg"}
                    `}
                  >
                    <item.icon className={`mr-3 h-6 w-6 ${isActive ? "stroke-[2.5px]" : ""}`} />
                    {item.title}
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>
      </div>

      {/* Sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0 z-20 relative">
        <div className="flex w-64 flex-col">
          <div className="flex min-h-0 flex-1 flex-col bg-[#f4f4fd]">
            <div className="flex h-16 flex-shrink-0 items-center border-b border-[#EBE0FF] px-4">
              <div className="flex items-center">
                <div className="h-16 w-full flex justify-center items-center ml-4">
                  <img src="/Sendora.png" alt="Sendora Logo" className="h-11 w-auto object-contain" />
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto">
              <nav className="flex-1 space-y-1 px-2 py-4">
                <div className="flex flex-col space-y-3">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center px-4 py-3 text-base transition-colors rounded-2xl
                          ${isActive
                            ? "bg-sidebar-selected-bg text-sidebar-active font-bold"
                            : "text-sidebar hover:text-sidebar-active hover:bg-sidebar-hover-bg"}
                        `}
                      >
                        <item.icon className={`mr-3 h-6 w-6 ${isActive ? "stroke-[2.5px]" : ""}`} />
                        {item.title}
                      </Link>
                    )
                  })}
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top navbar */}
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-[#FFFEFF] px-4 z-10 lg:pl-64">
          <div className="flex items-center">
            <button
              className="mr-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#9D5CFF] lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Logo Made in France */}
            <svg
              className="made-in-france hidden md:block"
              xmlns="http://www.w3.org/2000/svg"
              width="160"
              height="50"
              viewBox="0 0 370 100"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Bleu */}
              <rect y="30" width="80" height="20" fill="#1D3A86" />
              {/* Blanc */}
              <rect y="30" x="80" width="80" height="20" fill="#FFFEFF" />
              {/* Rouge */}
              <rect y="30" x="160" width="80" height="20" fill="#D83A28" />
              {/* Texte en dessous */}
              <text
                x="125"
                y="70"
                fontFamily="Arial, sans-serif"
                fontSize="18"
                fill="#000"
                textAnchor="middle"
                letterSpacing="5"
                fontWeight="bold"
              >
                MADE IN FRANCE
              </text>
            </svg>

            <button className="rounded-full bg-[#FFFEFF] p-1 text-gray-400 hover:text-[#9D5CFF] focus:outline-none focus:ring-2 focus:ring-[#9D5CFF] focus:ring-offset-2">
              <Bell className="h-6 w-6" />
            </button>

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none group">
                <div className="flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 group-data-[state=open]:bg-[#efeffb] hover:bg-[#efeffb] group-data-[state=open]:text-[#2d1863] hover:text-[#2d1863]">
                  <Building
                    className="h-5 w-5"
                    style={{ color: 'inherit' }}
                  />
                  <span className="font-bold uppercase text-gray-800 group-data-[state=open]:text-[#2d1863] hover:text-[#2d1863] group-data-[state=open]:font-bold hover:font-bold">
                    {isLoading ? "..." : user?.entreprise || "SENDORA"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-600 group-data-[state=open]:rotate-180" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl bg-[#FFFEFF] shadow-lg border p-1 min-w-[180px]">
                <DropdownMenuItem className="w-full p-0 h-10 font-semibold rounded-lg text-[16px] text-[#3d247a]">
                  <Link href="/mon-profil" className="flex w-full items-center gap-2 px-3 h-10 transition-colors hover:bg-[#efeffb] hover:text-[#3d247a] rounded-lg">
                    <Avatar className="-ml-1 mr-1 h-7 w-7">
                      <AvatarFallback style={user ? { background: customAvatarColor || '#FFD6D6', color: 'white', fontWeight: 700, fontSize: 15 } : {}}>
                        {!isLoading && user ? `${user.prenom?.charAt(0).toUpperCase() || ''}${user.nom?.charAt(0).toUpperCase() || ''}` : "..."}
                      </AvatarFallback>
                    </Avatar>
                    Mon profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="w-full p-0 h-10 font-semibold rounded-lg text-[16px] text-[#3d247a]">
                  <Link href="/mon-profil" className="flex w-full items-center gap-2 px-3 h-10 transition-colors hover:bg-[#efeffb] hover:text-[#3d247a] rounded-lg">
                    <CreditCard className="mr-2 h-5 w-5 text-[#3d247a]" />
                    Mon plan
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="w-full p-0 h-10 font-semibold rounded-lg text-[16px] text-[#3d247a]">
                  <Link href="/Utilisateurs" className="flex w-full items-center gap-2 px-3 h-10 transition-colors hover:bg-[#efeffb] hover:text-[#3d247a] rounded-lg">
                    <User className="mr-2 h-5 w-5 text-[#3d247a]" />
                    Utilisateurs
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="w-full p-0 h-10 font-semibold rounded-lg text-[16px] text-[#3d247a]">
                  <Link href="/expediteurs" className="flex w-full items-center gap-2 px-3 h-10 transition-colors hover:bg-[#efeffb] hover:text-[#3d247a] rounded-lg">
                    <Mail className="mr-2 h-5 w-5 text-[#3d247a]" />
                    Expéditeurs
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-[#efeffb]" />
                <DropdownMenuItem className="w-full p-0 h-10 font-semibold rounded-lg text-[16px] text-[#3d247a]" onClick={handleSignOut}>
                  <div className="flex w-full items-center gap-2 px-3 h-10 transition-colors hover:bg-[#efeffb] hover:text-[#3d247a] rounded-lg">
                    <LogOut className="mr-2 h-5 w-5 text-[#3d247a]" />
                    Déconnexion
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  )
}
