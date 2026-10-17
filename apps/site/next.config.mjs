export default {
  trailingSlash: true,
  transpilePackages: ["@veca/ui"],
  poweredByHeader: false,
  htmlLimitedBots: /.*/,
  experimental: { cpus: 2 },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.veca.com.pe" }],
        destination: "https://veca.com.pe/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "veronica.santillan.pro" }],
        destination: "https://veca.com.pe/:path*",
        permanent: true,
      },
      { source: "/index.html", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};
