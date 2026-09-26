import RegisterForm from "./RegisterForm.tsx";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">会員登録</h1>
        <RegisterForm />
      </div>
    </main>
  );
}
