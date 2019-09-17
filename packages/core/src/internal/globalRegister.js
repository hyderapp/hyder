export default function(name, value) {
  name = `$$hyder/global_register/${name}`;
  return global[name] || (global[name] = value);  // eslint-disable-line
}
