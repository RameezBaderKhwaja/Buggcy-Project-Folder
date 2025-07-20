"use client"

import { Link, useLocation } from "react-router-dom"
import { ShoppingCart, Store, User, Menu, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useCart } from "@/hooks/useCart"

const Header = () => {
  const { itemCount } = useCart()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  const navigationLinks = [
    { path: "/", label: "Home" },
    { path: "/products", label: "Products" },
    { path: "/blog", label: "Blog" },
    { path: "/about", label: "About" },
    { path: "/feedback", label: "Feedback" },
  ]

  return (
    <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="relative h-16 px-4 sm:px-6 lg:px-8 flex items-center">
        {/* Left: Mobile Menu */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-accent bg-transparent">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="flex flex-col space-y-2 mt-6">
                <div className="flex items-center space-x-2 mb-4 pb-3 border-b">
                  <Store className="h-5 w-5 text-primary" />
                  <span className="text-lg font-bold text-foreground">ShopHub</span>
                </div>
                {navigationLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center justify-center px-3 py-2 text-sm font-medium transition-colors hover:text-primary hover:bg-accent rounded-md ${
                      isActive(link.path) ? "text-primary bg-primary/10" : "text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Center: Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <Store className="h-6 w-6 text-primary" />
          <span className="text-lg sm:text-xl font-bold text-foreground">ShopHub</span>
        </Link>

        {/* Desktop Center Nav - Position absolute for center alignment */}
        <nav className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 space-x-6">
          {navigationLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive(link.path) ? "text-primary" : "text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: Icons */}
        <div className="absolute right-6 flex items-center space-x-2">
          {/* Search Icon - now links to the new SearchPage */}
          <Link to="/search">
            <Button variant="ghost" size="sm" className="relative hover:bg-accent bg-transparent border border-border">
              <Search className="h-5 w-5" />
            </Button>
          </Link>

          {/* Cart Icon */}
          <Link to="/cart">
            <Button variant="ghost" size="sm" className="relative hover:bg-accent bg-transparent border border-border">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {itemCount}
                </Badge>
              )}
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                // Removed size="sm" as h-8 w-8 overrides it, and it's not an icon button
                className="relative h-8 w-8 rounded-full hover:bg-accent bg-transparent border border-border"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-48 sm:w-56 bg-background border border-border shadow-lg"
              align="end"
              forceMount
            >
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/cart" className="cursor-pointer">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  My Cart
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export default Header
