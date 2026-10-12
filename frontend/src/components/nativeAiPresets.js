// Fill only editable inputs. Reference fields always come from loaded records.
export function fillNativeAiPreset(fields, sample, current = {}, records = {}, variant = 0) {
  const next = { ...current };
  const missing = [];
  const recordFields = new Set();
  for (const field of fields) {
    const key = field.key || field.name;
    if (field.type === 'dynamic-select' || field.type === 'claim' || /^(claim|policy|customer|document|adjuster)_id$/.test(key)) {
      const source = field.source || `${key.replace(/_id$/, '')}s`;
      const options = records[source] || [];
      const selected = options.find(item => String(item.id) === String(current[key]));
      if (current[key] && !selected) {
        next[key] = current[key];
        missing.push(`${field.label} (selected record could not be verified)`);
        continue;
      }
      const record = selected || options[variant % options.length];
      if (record) {
        next[key] = String(record.id);
        if (field.autoFill) {
          const derived = field.autoFill(record);
          Object.assign(next, derived);
          Object.keys(derived).forEach(name => recordFields.add(name));
        }
      } else {
        next[key] = current[key] || '';
        missing.push(field.label);
      }
      continue;
    }
    if (recordFields.has(key)) continue;
    if (/^(claim|policy|document)_number$/.test(key)) {
      next[key] = '';
      continue;
    }
    if (sample?.[key] !== undefined) next[key] = sample[key];
    else if (field.type === 'select') next[key] = field.options?.[variant % field.options.length] || '';
    else if (field.type === 'number') next[key] = [12500, 28500, 7600][variant % 3];
    else if (field.type === 'date') next[key] = new Date(Date.now() + (variant + 7) * 86400000).toISOString().slice(0, 10);
    else next[key] = `${['Review the reported loss and available evidence', 'Assess the documented impact and coverage', 'Prepare an adjuster review and next steps'][variant % 3]}. Confirm facts against the selected records before acting.`;
  }
  return { values: next, missing };
}
