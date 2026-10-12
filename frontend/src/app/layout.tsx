import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import "./globals.css";
import { StoreProvider } from "@/redux/StoreProvider";

// App-wide metadata for the document head
export const metadata: Metadata = {
  title: "MediaVault",
  description: "Private media tracker for games, movies, series, anime, and books",
};

// Root layout wrapping the entire app
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AppRouterCacheProvider>
          <StoreProvider>{children}</StoreProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
