import { RegisterForm } from "./register-form";

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <RegisterForm next={next} />
    </div>
  );
}
