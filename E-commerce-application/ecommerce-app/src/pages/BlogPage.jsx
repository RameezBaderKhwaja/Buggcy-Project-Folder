import { Calendar, User, ArrowRight, Clock } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const BlogPage = () => {
  const blogPosts = [
    {
      id: 1,
      title: "The Future of Online Shopping: Trends to Watch in 2024",
      excerpt:
        "Discover the latest trends shaping the eCommerce landscape and how they'll impact your shopping experience.",
      content: "Full article content here...",
      author: "Sarah Johnson",
      date: "2024-01-15",
      category: "Technology",
      image:
        "https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&dpr=1",
      readTime: "5 min read",
    },
    {
      id: 2,
      title: "Sustainable Shopping: Making Eco-Friendly Choices",
      excerpt:
        "Learn how to make more sustainable purchasing decisions and reduce your environmental impact while shopping.",
      content: "Full article content here...",
      author: "Mike Chen",
      date: "2024-01-12",
      category: "Sustainability",
      image:
        "https://images.pexels.com/photos/1029896/pexels-photo-1029896.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&dpr=1",
      readTime: "7 min read",
    },
    {
      id: 3,
      title: "Product Review: Top 10 Must-Have Gadgets This Season",
      excerpt:
        "Our comprehensive review of the season's most innovative and useful gadgets that are worth your investment.",
      content: "Full article content here...",
      author: "Emily Rodriguez",
      date: "2024-01-10",
      category: "Reviews",
      image:
        "https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&dpr=1",
      readTime: "10 min read",
    },
    {
      id: 4,
      title: "Fashion Forward: Spring Collection Highlights",
      excerpt: "Explore the latest fashion trends and discover the standout pieces from our spring collection.",
      content: "Full article content here...",
      author: "Jessica Taylor",
      date: "2024-01-08",
      category: "Fashion",
      image:
        "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&dpr=1",
      readTime: "6 min read",
    },
    {
      id: 5,
      title: "Home Decor Trends: Creating Your Perfect Space",
      excerpt: "Transform your living space with these trending home decor ideas and styling tips from our experts.",
      content: "Full article content here...",
      author: "David Wilson",
      date: "2024-01-05",
      category: "Home & Living",
      image:
        "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&dpr=1",
      readTime: "8 min read",
    },
    {
      id: 6,
      title: "Customer Success Stories: Real Reviews, Real Results",
      excerpt:
        "Read inspiring stories from our customers and discover how our products have made a difference in their lives.",
      content: "Full article content here...",
      author: "Lisa Anderson",
      date: "2024-01-03",
      category: "Customer Stories",
      image:
        "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&dpr=1",
      readTime: "4 min read",
    },
  ]

  const categories = ["All", "Technology", "Sustainability", "Reviews", "Fashion", "Home & Living", "Customer Stories"]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          ShopHub Blog
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Stay updated with the latest trends, product reviews, and shopping tips from our expert team.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map((category) => (
          <Button
            key={category}
            variant={category === "All" ? "default" : "outline"}
            size="sm"
            className="rounded-full"
          >
            {category}
          </Button>
        ))}
      </div>

      <Card className="mb-12 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="aspect-video lg:aspect-auto">
            <img
              src={blogPosts[0].image || "/placeholder.svg"}
              alt={blogPosts[0].title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-8 flex flex-col justify-center">
            <Badge className="w-fit mb-4">{blogPosts[0].category}</Badge>
            <h2 className="text-2xl font-bold mb-4 hover:text-primary transition-colors cursor-pointer">
              {blogPosts[0].title}
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">{blogPosts[0].excerpt}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{blogPosts[0].author}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(blogPosts[0].date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{blogPosts[0].readTime}</span>
                </div>
              </div>
              <Button variant="outline" className="group bg-background border border-border hover:bg-accent">
                Read More
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogPosts.slice(1).map((post) => (
          <Card key={post.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="aspect-video overflow-hidden">
              <img
                src={post.image || "/placeholder.svg"}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary">{post.category}</Badge>
                <span className="text-xs text-muted-foreground">{post.readTime}</span>
              </div>
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors cursor-pointer line-clamp-2">
                {post.title}
              </h3>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="group p-0 h-auto bg-background border border-border hover:bg-accent"
                >
                  Read More
                  <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-12">
        <Button variant="outline" size="lg" className="bg-background border border-border hover:bg-accent">
          Load More Articles
        </Button>
      </div>
    </div>
  )
}

export default BlogPage
  