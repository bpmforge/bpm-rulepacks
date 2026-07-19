export function getName(user) {
  if (user.name === null || user.name === undefined) {
    return "anonymous";
  }
  return user.name;
}
