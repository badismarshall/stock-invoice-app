
export default async function AuthLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {

    return (
      <div className="flex flex-col justify-center items-center h-screen">
          <main className="flex w-[350px] sm:w-max">{children}</main>
      </div>
    );
}