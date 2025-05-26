export function capitalizeFirstLetter(str) {
  if (!str) return "";
  if (str.length === 0) return ""; // Handle empty strings
  return str
    .split(" ") // Split the paragraph into words
    .map((word) => {
      if (word.length === 0) return word; // Handle empty words (e.g., multiple spaces)
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); // Capitalize first letter and make other letters lowercase
    })
    .join(" "); // Join the words back into a single string
}
