import { auth0 } from "@/lib/auth0";

export default async function HomePage() {
  const session = await auth0.getSession();

  return (
    <main className="p-8 font-sans">
      <h1 className="mb-2 text-3xl font-bold">Clubee</h1>
      <p className="mb-6 text-gray-700">
        Create and manage paid clubs for shared tastes and hobbies.
      </p>

      {!session ? (
        <div className="flex gap-4">
          <a
            href="/auth/login?screen_hint=signup"
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Signup
          </a>
          <a
            href="/auth/login"
            className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100"
          >
            Login
          </a>
        </div>
      ) : (
        <div>
          <p className="mb-4">Logged in as {session.user.email}</p>
          <details className="mb-4">
            <summary className="cursor-pointer text-blue-600">
              View Profile
            </summary>
            <pre className="mt-2 overflow-auto rounded bg-gray-100 p-4 text-sm">
              {JSON.stringify(session.user, null, 2)}
            </pre>
          </details>
          <a
            href="/auth/logout"
            className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100"
          >
            Logout
          </a>
        </div>
      )}
    </main>
  );
}
