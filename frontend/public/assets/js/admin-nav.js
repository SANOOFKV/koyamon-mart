/**
 * Shared mobile nav behavior for admin pages. The sidebar (id="admin-sidebar")
 * is an off-canvas drawer below the md breakpoint, controlled by toggling the
 * "-translate-x-full" class; its backdrop (id="admin-sidebar-backdrop") closes
 * it on outside-click. Both are static/visible again at md+ via Tailwind's
 * md:translate-x-0 / md:hidden on the elements themselves.
 */
function toggleAdminSidebar() {
  document.getElementById('admin-sidebar')?.classList.toggle('-translate-x-full');
  document.getElementById('admin-sidebar-backdrop')?.classList.toggle('hidden');
}

function closeAdminSidebar() {
  document.getElementById('admin-sidebar')?.classList.add('-translate-x-full');
  document.getElementById('admin-sidebar-backdrop')?.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  // Tapping a nav link should close the drawer rather than leave it open
  // while the next page loads.
  document.querySelectorAll('#admin-sidebar a').forEach((a) => a.addEventListener('click', closeAdminSidebar));
});
