export function capitalizeWords(phrase: string) {
  return phrase.replace(
    /\b\w+/g,
    word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
}