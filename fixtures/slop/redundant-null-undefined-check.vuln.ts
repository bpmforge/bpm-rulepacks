export function getName(user: User): string {
  if (user.name === null || user.name === undefined) {
    return "anonymous";
  }
  return user.name;
}
