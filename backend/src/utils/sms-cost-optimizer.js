/**
 * Fast2SMS Cost Optimizer
 * 
 * Converts Unicode characters to GSM-compatible alternatives
 * to optimize SMS costs by avoiding double charges for Unicode
 */

/**
 * Optimize SMS text to avoid Unicode characters that cost extra
 * @param {string} message - Original message with potential Unicode characters
 * @returns {string} - Optimized message using only GSM characters
 */
function optimizeSmsText(message) {
  // Replace common Unicode characters with GSM-compatible alternatives
  return message
    // Currency symbols
    .replace(/₹/g, 'Rs.')
    .replace(/€/g, 'EUR')
    .replace(/£/g, 'GBP')
    .replace(/¥/g, 'JPY')
    
    // Check marks and crosses
    .replace(/✓|✅|☑️|✔️/g, '+')
    .replace(/❌|✖️|✘/g, 'X')
    
    // Bullets and decorative characters
    .replace(/•|⁃|‣|⦿|⁌|⁍/g, '-')
    .replace(/→|⟶|➔|➜|➞/g, '->')
    .replace(/←|⟵|⟸|⬅️/g, '<-')
    
    // Quotes
    .replace(/"|"|❝|❞/g, '"')
    .replace(/'|'/g, "'")
    
    // Dashes and spaces
    .replace(/—|–/g, '-')
    .replace(/\s+/g, ' ')
    
    // Emojis (remove completely or replace with text alternatives)
    .replace(/😊|😀|😃|😄/g, ':)')
    .replace(/😢|😭|😥/g, ':(')
    
    // General emoji cleanup (remove any remaining emojis)
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '')  // Face emojis
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')  // Symbols & pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')  // Transport & map symbols
    .replace(/[\u{2600}-\u{26FF}]/gu, '')    // Miscellaneous symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')    // Dingbats
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')  // Supplemental symbols and pictographs
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ''); // Flags
}

// Example usage:
/*
const originalMessage = "Your fee of ₹5000 is due on 20th Aug 2023 ✓";
const optimizedMessage = optimizeSmsText(originalMessage);
console.log("Original:", originalMessage);  // Uses Unicode, costs 2 SMS units
console.log("Optimized:", optimizedMessage); // "Your fee of Rs.5000 is due on 20th Aug 2023 +"
*/

module.exports = { optimizeSmsText };
