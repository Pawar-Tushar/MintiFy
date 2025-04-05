import { Wallet, ShieldCheck, Zap, Sparkles, BarChart3, Globe, Users, Gift } from "lucide-react"

export default function FeaturesSection() {
  const features = [
    {
      icon: <Wallet className="h-10 w-10 text-purple-600" />,
      title: "Easy Wallet Integration",
      description: "Connect your crypto wallet with a single click and start trading NFTs instantly.",
    },
    {
      icon: <ShieldCheck className="h-10 w-10 text-purple-600" />,
      title: "Secure Transactions",
      description: "All transactions are secured with blockchain technology for maximum protection.",
    },
    {
      icon: <Zap className="h-10 w-10 text-purple-600" />,
      title: "Lightning Fast",
      description: "Experience lightning-fast transactions on the Solana blockchain network.",
    },
    {
      icon: <Sparkles className="h-10 w-10 text-purple-600" />,
      title: "Exclusive Collections",
      description: "Access limited edition NFT drops from world-renowned artists and creators.",
    },
    {
      icon: <BarChart3 className="h-10 w-10 text-purple-600" />,
      title: "Market Analytics",
      description: "Track market trends and make informed decisions with our advanced analytics.",
    },
    {
      icon: <Globe className="h-10 w-10 text-purple-600" />,
      title: "Global Marketplace",
      description: "Connect with creators and collectors from around the world in our global community.",
    },
    {
      icon: <Users className="h-10 w-10 text-purple-600" />,
      title: "Community Rewards",
      description: "Earn rewards for participating in our vibrant community of NFT enthusiasts.",
    },
    {
      icon: <Gift className="h-10 w-10 text-purple-600" />,
      title: "Zero Gas Fees",
      description: "Enjoy minimal transaction costs with Solana's efficient blockchain technology.",
    },
  ]

  return (
    <section className="w-full py-20 bg-gradient-to-b from-background to-purple-50 dark:from-background dark:to-purple-950/10">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-sm">
              Powerful Features
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Everything You Need for Your NFT Journey
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Our platform provides all the tools you need to create, collect, and trade NFTs with ease.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12 mt-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-lg border bg-background p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 h-20 w-20 bg-gradient-to-bl from-purple-100 to-transparent dark:from-purple-900/20 dark:to-transparent rounded-bl-full"></div>
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-muted-foreground mt-2">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

