"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Store, Mail, Facebook, Twitter, Instagram, Youtube, Send, MapPin, Phone, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useModal } from "@/hooks/useModal"

const Footer = () => {
  const [email, setEmail] = useState("")
  const { showModal } = useModal()

  const handleNewsletterSubmit = (e) => {
    e.preventDefault()
    if (email.trim()) {
      showModal({
        title: "Subscribed!",
        content: "Thank you for subscribing to our newsletter. You'll receive the latest updates and offers!",
        type: "success",
      })
      setEmail("")
    } else {
      showModal({
        title: "Subscription Failed",
        content: "Please enter a valid email address to subscribe.",
        type: "error",
      })
    }
  }

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook", color: "hover:text-blue-600" },
    { icon: Twitter, href: "#", label: "Twitter", color: "hover:text-blue-400" },
    { icon: Instagram, href: "#", label: "Instagram", color: "hover:text-pink-500" },
    { icon: Youtube, href: "#", label: "YouTube", color: "hover:text-red-500" },
  ]

  const quickLinks = [
    { to: "/about", label: "About Us" },
    { to: "/blog", label: "Blog" },
    { to: "/feedback", label: "Contact & Feedback" },
    { href: "#", label: "FAQ" },
    { href: "#", label: "Shipping Info" },
  ]

  const supportLinks = [
    { href: "#", label: "Terms of Service" },
    { href: "#", label: "Privacy Policy" },
    { href: "#", label: "Customer Service" },
    { href: "#", label: "Returns & Refunds" },
    { href: "#", label: "Track Your Order" },
  ]

  const contactInfo = [
    { icon: MapPin, text: "123 Commerce St, Sindh 10001" },
    { icon: Phone, text: "+92 123 456 7890" },
    { icon: Clock, text: "Mon-Fri 9AM-6PM PKT" },
  ]

  return (
    <footer className="bg-slate-900 text-white">
      <div className="w-full px-2 sm:px-3 lg:px-4 py-1">
        {/* Main Footer Content */}
        <div className="py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-2 mb-3">
                <Store className="h-6 w-6 text-blue-400" />
                <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  ShopHub
                </span>
              </div>
              <p className="text-gray-300 leading-relaxed mb-3 text-sm">
                Your one-stop shop for everything you need. Quality products, great prices, and excellent service
                delivered right to your door.
              </p>
              <div className="flex space-x-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    className={`w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 transition-all duration-300 flex items-center justify-center ${social.color} group`}
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-sm mb-3 text-white">Quick Links</h4>
              <div className="space-y-1.5">
                {quickLinks.map((link, index) => (
                  <div key={index}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        className="text-gray-300 hover:text-blue-400 transition-colors duration-300 flex items-center group text-xs"
                      >
                        <span className="group-hover:translate-x-1 transition-transform duration-300">
                          {link.label}
                        </span>
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-gray-300 hover:text-blue-400 transition-colors duration-300 flex items-center group text-xs"
                      >
                        <span className="group-hover:translate-x-1 transition-transform duration-300">
                          {link.label}
                        </span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Support & Legal */}
            <div>
              <h4 className="font-semibold text-sm mb-3 text-white">Support & Legal</h4>
              <div className="space-y-1.5">
                {supportLinks.map((link, index) => (
                  <div key={index}>
                    <a
                      href={link.href}
                      className="text-gray-300 hover:text-blue-400 transition-colors duration-300 flex items-center group text-xs"
                    >
                      <span className="group-hover:translate-x-1 transition-transform duration-300">{link.label}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact & Newsletter */}
            <div>
              <h4 className="font-semibold text-sm mb-3 text-white">Get in Touch</h4>

              {/* Contact Info */}
              <div className="space-y-2 mb-3">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-center space-x-2 text-gray-300">
                    <info.icon className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    <span className="text-xs">{info.text}</span>
                  </div>
                ))}
              </div>

              {/* Newsletter */}
              <div>
                <h5 className="font-medium mb-2 text-white text-xs">Stay Updated</h5>
                <p className="text-gray-300 text-xs mb-2">Subscribe for the latest updates and exclusive offers.</p>
                <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 bg-slate-800 border-slate-700 text-white placeholder-gray-400 focus:border-blue-400 h-8 text-xs"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8 font-medium group transition-all duration-300 text-xs border-blue-600"
                  >
                    <Send className="h-3 w-3 mr-2 group-hover:translate-x-1 transition-transform" />
                    Subscribe
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-slate-800 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
            <p className="text-gray-400 text-xs text-center md:text-left">© 2025 ShopHub. All rights reserved.</p>
            <div className="flex items-center space-x-2 text-gray-400 text-xs">
              <span>Made by the ShopHub Team</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
