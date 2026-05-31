'use strict';

// Strips the target name and filler phrases from a natural-language message
// so "Oli can you call the dentist?" becomes "Call the dentist"
function parseTask(text, targetName = 'Oli') {
  if (!text || !text.trim()) return null;

  let task = text.trim();

  // Strip leading name (e.g. "Oli, " or "Oli ")
  const namePattern = new RegExp(`^${targetName}[,\\s]+`, 'i');
  task = task.replace(namePattern, '');

  // Strip filler phrases — most specific first, loop until stable
  const fillers = [
    /^can you please\s+/i,
    /^could you please\s+/i,
    /^would you please\s+/i,
    /^can you\s+/i,
    /^could you\s+/i,
    /^would you\s+/i,
    /^please\s+/i,
    /^don't forget to\s+/i,
    /^dont forget to\s+/i,
    /^remember to\s+/i,
    /^don't forget\s+/i,
    /^dont forget\s+/i,
    /^you need to\s+/i,
    /^you should\s+/i,
    /^make sure to\s+/i,
    /^make sure you\s+/i,
  ];

  let changed = true;
  while (changed) {
    changed = false;
    for (const filler of fillers) {
      const stripped = task.replace(filler, '');
      if (stripped !== task) {
        task = stripped;
        changed = true;
      }
    }
  }

  task = task.trim();
  if (!task) return null;

  // Capitalise first letter
  task = task.charAt(0).toUpperCase() + task.slice(1);

  // Remove trailing question marks (it's a task, not a question)
  task = task.replace(/\?+$/, '').trim();

  return task || null;
}

module.exports = { parseTask };
