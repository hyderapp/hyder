export default function(obj, path) {
  const parts = path.split(/\./);
  const len = parts.length;
  for (let i = 0; i < len && obj; i++) {
    obj = obj[parts[i]];
  }
  return obj;
}
