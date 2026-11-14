import "./globals.css";

export const metadata = {
  title: "Questathon CRM — Vivek",
  description: "Live CRM for two accounts, every number traced to its source.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
