import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

const PublicInterviewLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-dark-100 root-layout">
          <nav>
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="MockMate Logo"
                width={38}
                height={32}
              />
              <h2 className="text-primary-100"></h2>
            </Link>
          </nav>
          <div className="container mx-auto p-6">{children}</div>
        </div>
      </body>
    </html>
  );
};

export default PublicInterviewLayout;
