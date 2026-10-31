import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold text-gray-900">Not Found</h2>
      <p className="mt-2 text-lg text-gray-600">
        The page you're looking for doesn't exist.
      </p>
      <Link
        href="/"
        className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-md font-medium text-white hover:bg-blue-700"
      >
        Go Home
      </Link>
    </div>
  );
}
