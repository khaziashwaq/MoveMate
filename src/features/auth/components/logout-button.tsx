"use client";

import { logout } from "../actions/logout";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      >
        Sign out
      </button>
    </form>
  );
}
