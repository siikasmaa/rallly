export function absoluteUrl() {
  return process.env.PUBLIC_BASE_URL ?? "http://localhost:4321";
}
