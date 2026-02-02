"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Check,
  BarChart3,
  Layout,
  Monitor,
  Zap,
  Shield,
  Globe,
  Gauge,
  Wind,
  Thermometer,
  Droplets,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isLoaded && userId) {
      router.push("/dashboard");
    }
  }, [isLoaded, userId, router]);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 shadow-lg shadow-primary/25">
              <Wind className="h-5 w-5 text-white" />
              <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-xl font-bold tracking-tight">Breathe</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#integrations" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Integrations
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="shadow-lg shadow-primary/25">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Now supporting Qingping sensors
            </Badge>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="block text-foreground">Air quality insights</span>
              <span className="block bg-gradient-to-r from-primary via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                anywhere you need them
              </span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Transform your air quality sensors into beautiful dashboards, embeddable widgets, 
              and kiosk displays. One platform for all your indoor air monitoring needs.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto gap-2 text-base shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>5-minute setup</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Hero visual - Animated dashboard preview */}
          <div className={`mt-20 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="relative mx-auto max-w-5xl">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-border bg-card p-2 shadow-2xl">
                <div className="rounded-xl bg-muted/50 p-8">
                  {/* Mock dashboard */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard icon={<Gauge className="h-5 w-5" />} label="PM2.5" value="12" unit="µg/m³" status="Excellent" statusColor="text-primary" />
                    <MetricCard icon={<Wind className="h-5 w-5" />} label="CO₂" value="542" unit="ppm" status="Good" statusColor="text-emerald-500" />
                    <MetricCard icon={<Thermometer className="h-5 w-5" />} label="Temperature" value="23.4" unit="°C" status="Comfortable" statusColor="text-primary" />
                    <MetricCard icon={<Droplets className="h-5 w-5" />} label="Humidity" value="48" unit="%" status="Optimal" statusColor="text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to monitor air quality
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              From real-time dashboards to embeddable widgets, we&apos;ve got you covered.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Real-time Dashboard"
              description="Monitor all your sensors in one beautiful dashboard with live updates, historical charts, and customizable views."
            />
            <FeatureCard
              icon={<Layout className="h-6 w-6" />}
              title="Embeddable Widgets"
              description="Add air quality data to your website with our customizable embed widgets. Perfect for offices, schools, and public spaces."
            />
            <FeatureCard
              icon={<Monitor className="h-6 w-6" />}
              title="Kiosk Mode"
              description="Turn any display into an air quality monitor with our full-screen kiosk mode. Ideal for lobbies and waiting areas."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Instant Alerts"
              description="Get notified when air quality drops below your threshold. Never miss an important change."
              badge="Coming Soon"
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Secure & Private"
              description="Your data is encrypted and stored securely. We never share your information with third parties."
            />
            <FeatureCard
              icon={<Globe className="h-6 w-6" />}
              title="Multi-Location Support"
              description="Monitor air quality across multiple locations from a single account. Perfect for businesses and property managers."
            />
          </div>
        </div>
      </section>

      {/* Integrations/Roadmap Section */}
      <section id="integrations" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Integrations</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Works with your favorite sensors
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              We&apos;re building support for all major air quality sensor brands.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <IntegrationCard
              name="Qingping"
              description="Air Monitor Lite, Air Monitor"
              status="available"
            />
            <IntegrationCard
              name="Awair"
              description="Element, Omni, Mint"
              status="coming"
            />
            <IntegrationCard
              name="PurpleAir"
              description="Indoor, Outdoor, Flex"
              status="coming"
            />
            <IntegrationCard
              name="Airthings"
              description="Wave, View, Space"
              status="planned"
            />
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t see your sensor? <Link href="/contact" className="text-primary hover:underline">Let us know</Link> and we&apos;ll add it to our roadmap.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free and scale as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
            <PricingCard
              name="Free"
              price="$0"
              description="Perfect for getting started"
              features={[
                "Up to 2 devices",
                "Real-time dashboard",
                "7-day data history",
                "1 embed widget",
                "Community support",
              ]}
              buttonText="Get Started"
              buttonVariant="outline"
            />
            <PricingCard
              name="Pro"
              price="$9"
              period="/month"
              description="For homes and small offices"
              features={[
                "Up to 10 devices",
                "Real-time dashboard",
                "90-day data history",
                "Unlimited widgets",
                "Kiosk mode",
                "Email alerts",
                "Priority support",
              ]}
              buttonText="Start Free Trial"
              buttonVariant="default"
              popular
            />
            <PricingCard
              name="Business"
              price="$29"
              period="/month"
              description="For larger deployments"
              features={[
                "Unlimited devices",
                "Real-time dashboard",
                "1-year data history",
                "Unlimited widgets",
                "Kiosk mode",
                "Custom branding",
                "API access",
                "Dedicated support",
              ]}
              buttonText="Contact Sales"
              buttonVariant="outline"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-emerald-500 to-teal-600 px-8 py-16 text-center shadow-2xl sm:px-16">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to breathe easier?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
                Join thousands of users who trust Breathe to monitor their indoor air quality. 
                Get started in minutes.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2 text-base font-semibold">
                    Start Your Free Trial
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-600">
                <Wind className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">Breathe</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
              <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
              <Link href="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Breathe. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Component: Metric Card for hero
function MetricCard({
  icon,
  label,
  value,
  unit,
  status,
  statusColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  status: string;
  statusColor: string;
}) {
  return (
    <div className="rounded-xl bg-card p-4 shadow-sm border border-border">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      <span className={`text-xs font-medium ${statusColor}`}>{status}</span>
    </div>
  );
}

// Component: Feature Card
function FeatureCard({
  icon,
  title,
  description,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      {badge && (
        <Badge className="absolute top-4 right-4 text-xs" variant="secondary">
          {badge}
        </Badge>
      )}
      <CardHeader>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

// Component: Integration Card
function IntegrationCard({
  name,
  description,
  status,
}: {
  name: string;
  description: string;
  status: "available" | "coming" | "planned";
}) {
  const statusConfig = {
    available: { label: "Available", className: "bg-primary/10 text-primary" },
    coming: { label: "Coming Soon", className: "bg-amber-500/10 text-amber-600" },
    planned: { label: "Planned", className: "bg-muted text-muted-foreground" },
  };

  const config = statusConfig[status];

  return (
    <Card className={`transition-all ${status === "available" ? "border-primary/50" : ""}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted font-bold text-lg">
            {name[0]}
          </div>
          <Badge variant="outline" className={config.className}>
            {config.label}
          </Badge>
        </div>
        <h3 className="font-semibold text-lg">{name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

// Component: Pricing Card
function PricingCard({
  name,
  price,
  period,
  description,
  features,
  buttonText,
  buttonVariant,
  popular,
}: {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonVariant: "default" | "outline";
  popular?: boolean;
}) {
  return (
    <Card className={`relative transition-all ${popular ? "border-primary shadow-xl scale-105" : "hover:shadow-lg"}`}>
      {popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          Most Popular
        </Badge>
      )}
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold">{price}</span>
          {period && <span className="text-muted-foreground">{period}</span>}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ul className="space-y-3 mb-6">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Link href="/signup" className="block">
          <Button variant={buttonVariant} className="w-full">
            {buttonText}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
