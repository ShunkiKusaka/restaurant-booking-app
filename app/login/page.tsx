import LoginForm from "./LoginForm.tsx";
import { PageContainer, ui } from "../components/ui.tsx";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { registered, callbackUrl } = await searchParams;

  return (
    <PageContainer width="narrow">
      <div className={`${ui.card} p-6`}>
        <h1 className="mb-6 text-xl font-bold text-ink">ログイン</h1>
        <LoginForm
          registered={registered === "1"}
          callbackUrl={typeof callbackUrl === "string" ? callbackUrl : undefined}
        />
      </div>
    </PageContainer>
  );
}
