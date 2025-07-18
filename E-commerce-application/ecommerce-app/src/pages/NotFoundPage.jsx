import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Animation */}
          <div className="relative mb-8">
            <div className="text-9xl font-bold text-primary/20 select-none">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <ShoppingBag className="h-24 w-24 text-primary animate-bounce" />
            </div>
          </div>

          {/* Error Message */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Oops! Page Not Found
              </h1>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                The page you're looking for seems to have wandered off into the digital wilderness. 
                Don't worry though – we'll help you find your way back to shopping!
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Search className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Search Products</h3>
                  <p className="text-sm text-muted-foreground">Find what you're looking for</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Home className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Browse Categories</h3>
                  <p className="text-sm text-muted-foreground">Explore our collections</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/">
                  <Button size="lg" className="w-full sm:w-auto group">
                    <Home className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    Back to Home
                  </Button>
                </Link>
                <Link to="/products">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto group">
                    <Search className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    Browse Products
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Or try one of these popular sections:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/products?category=electronics">
                <Button variant="ghost" size="sm" className="text-xs">
                  Electronics
                </Button>
              </Link>
              <Link to="/products?category=clothing">
                <Button variant="ghost" size="sm" className="text-xs">
                  Clothing
                </Button>
              </Link>
              <Link to="/blog">
                <Button variant="ghost" size="sm" className="text-xs">
                  Blog
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="ghost" size="sm" className="text-xs">
                  About Us
                </Button>
              </Link>
              <Link to="/feedback">
                <Button variant="ghost" size="sm" className="text-xs">
                  Contact
                </Button>
              </Link>
            </div>
          </div>

          {/* Go Back Button */}
          <div className="mt-8">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
