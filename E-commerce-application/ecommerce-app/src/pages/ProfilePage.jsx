"use client"

import { useState } from "react"
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X, Package, Heart, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

const ProfilePage = () => {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: "Rameez",
    lastName: "Bader",
    email: "rameez.bader@example.com",
    phone: "+92 300 1234567",
    address: "123 Main Street",
    city: "Karachi",
    state: "Sindh",
    zipCode: "123456",
    joinDate: "2023-01-15",
  })

  const [editData, setEditData] = useState(profileData)

  const handleEdit = () => {
    setIsEditing(true)
    setEditData(profileData)
  }

  const handleSave = () => {
    setProfileData(editData)
    setIsEditing(false)
    toast({
      title: "Profile updated",
      description: "Your profile information has been successfully updated.",
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData(profileData)
  }

  const handleInputChange = (field, value) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const recentOrders = [
    {
      id: "ORD-001",
      date: "2024-01-20",
      status: "Delivered",
      total: 89.99,
      items: 3,
    },
    {
      id: "ORD-002",
      date: "2024-01-15",
      status: "Shipped",
      total: 156.5,
      items: 2,
    },
    {
      id: "ORD-003",
      date: "2024-01-10",
      status: "Processing",
      total: 45.0,
      items: 1,
    },
  ]

  const wishlistItems = [
    {
      id: 1,
      name: "Wireless Headphones",
      price: 199.99,
      image:
        "https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1",
    },
    {
      id: 2,
      name: "Smart Watch",
      price: 299.99,
      image:
        "https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1",
    },
    {
      id: 3,
      name: "Laptop Stand",
      price: 79.99,
      image:
        "https://images.pexels.com/photos/4158/apple-iphone-smartphone-desk.jpg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-1">
                {profileData.firstName} {profileData.lastName}
              </h2>
              <p className="text-muted-foreground mb-4">{profileData.email}</p>
              <Badge variant="secondary" className="mb-4">
                Premium Member
              </Badge>
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                Member since {new Date(profileData.joinDate).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Personal Information</CardTitle>
                  {!isEditing ? (
                    <Button onClick={handleEdit} variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button onClick={handleSave} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button onClick={handleCancel} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      {isEditing ? (
                        <Input
                          id="firstName"
                          value={editData.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                        />
                      ) : (
                        <div className="flex items-center space-x-2 mt-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{profileData.firstName}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      {isEditing ? (
                        <Input
                          id="lastName"
                          value={editData.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                        />
                      ) : (
                        <div className="flex items-center space-x-2 mt-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{profileData.lastName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    ) : (
                      <div className="flex items-center space-x-2 mt-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{profileData.email}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={editData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    ) : (
                      <div className="flex items-center space-x-2 mt-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{profileData.phone}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="address">Address</Label>
                    {isEditing ? (
                      <Input
                        id="address"
                        value={editData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                      />
                    ) : (
                      <div className="flex items-center space-x-2 mt-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{profileData.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      {isEditing ? (
                        <Input
                          id="city"
                          value={editData.city}
                          onChange={(e) => handleInputChange("city", e.target.value)}
                        />
                      ) : (
                        <div className="mt-2">{profileData.city}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      {isEditing ? (
                        <Input
                          id="state"
                          value={editData.state}
                          onChange={(e) => handleInputChange("state", e.target.value)}
                        />
                      ) : (
                        <div className="mt-2">{profileData.state}</div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      {isEditing ? (
                        <Input
                          id="zipCode"
                          value={editData.zipCode}
                          onChange={(e) => handleInputChange("zipCode", e.target.value)}
                        />
                      ) : (
                        <div className="mt-2">{profileData.zipCode}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Recent Orders</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-semibold">{order.id}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(order.date).toLocaleDateString()} • {order.items} items
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${order.total}</div>
                          <Badge
                            variant={
                              order.status === "Delivered"
                                ? "default"
                                : order.status === "Shipped"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Wishlist Tab */}
            <TabsContent value="wishlist">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="h-5 w-5" />
                    <span>My Wishlist</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {wishlistItems.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-32 object-cover rounded-md mb-3"
                        />
                        <h3 className="font-semibold mb-2">{item.name}</h3>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">${item.price}</span>
                          <Button size="sm">Add to Cart</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Account Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Email notifications</span>
                        <Button variant="outline" size="sm">
                          Enabled
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Order updates</span>
                        <Button variant="outline" size="sm">
                          Enabled
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Marketing emails</span>
                        <Button variant="outline" size="sm">
                          Disabled
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold">Security</h3>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        Change Password
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        Two-Factor Authentication
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        Login History
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold">Account Actions</h3>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        Download My Data
                      </Button>
                      <Button variant="destructive" className="w-full justify-start">
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
