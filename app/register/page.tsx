import RegisterForm from "./RegisterForm.tsx";
import { PageContainer, ui } from "../components/ui.tsx";

export default function RegisterPage() {
  return (
    <PageContainer width="narrow">
      <div className={`${ui.card} p-6`}>
        <h1 className="mb-6 text-xl font-bold text-ink">会員登録</h1>
        <RegisterForm />
      </div>
    </PageContainer>
  );
}
